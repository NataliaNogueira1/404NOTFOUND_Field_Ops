package com.fieldops.evidence.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.AbortableInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

class S3EvidenceStorageTest {
    private static final String BUCKET = "fieldops-evidencias-test";

    private static final Duration PRESIGN_TTL = Duration.ofMinutes(5);

    private S3Client s3;
    private S3EvidenceStorage storage;

    @BeforeEach
    void setUp() {
        s3 = mock(S3Client.class);
        // Real presigner with fake static credentials: signing is local, no network call is made.
        S3Presigner presigner = S3Presigner.builder().region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create("test-access-key", "test-secret-key")))
                .build();
        storage = new S3EvidenceStorage(s3, presigner, BUCKET, PRESIGN_TTL);
    }

    @Test
    void createsATemporaryDownloadUrlForTheObjectThatExpiresAfterTheConfiguredTtl() {
        Instant before = Instant.now();

        TemporaryEvidenceUrl temporary = storage.temporaryDownloadUrl("abc.png").orElseThrow();

        assertThat(temporary.url().getHost()).contains(BUCKET);
        assertThat(temporary.url().getPath()).isEqualTo("/abc.png");
        assertThat(temporary.url().getQuery()).contains("X-Amz-Expires=300").contains("X-Amz-Signature=");
        assertThat(temporary.expiresAt()).isBetween(before.plus(PRESIGN_TTL).minusSeconds(5),
                Instant.now().plus(PRESIGN_TTL).plusSeconds(5));
    }

    @Test
    void doesNotCreateTemporaryUrlsForBlankOrNullReferences() {
        assertThat(storage.temporaryDownloadUrl(null)).isEmpty();
        assertThat(storage.temporaryDownloadUrl("   ")).isEmpty();
    }

    @Test
    void storesTheBinaryInTheConfiguredBucketUsingTheReturnedReferenceAsKey() {
        String reference = storage.store(new byte[] {1, 2, 3}, "jpeg");

        ArgumentCaptor<PutObjectRequest> request = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3).putObject(request.capture(), any(RequestBody.class));
        assertThat(request.getValue().bucket()).isEqualTo(BUCKET);
        assertThat(request.getValue().key()).isEqualTo(reference);
        assertThat(request.getValue().contentType()).isEqualTo("image/jpeg");
        assertThat(request.getValue().contentLength()).isEqualTo(3L);
        assertThat(reference).endsWith(".jpeg").doesNotContain("/");
    }

    @Test
    void normalizesDangerousOrEmptyExtensionsSoTheKeyNeverContainsASegment() {
        String traversal = storage.store(new byte[] {1}, "../../evil");
        String empty = storage.store(new byte[] {1}, "   ");

        assertThat(traversal).doesNotContain("/").doesNotContain("..");
        assertThat(empty).endsWith(".bin");
    }

    @Test
    void usesOctetStreamWhenTheExtensionHasNoKnownContentType() {
        storage.store(new byte[] {1}, "zzzz");

        ArgumentCaptor<PutObjectRequest> request = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3).putObject(request.capture(), any(RequestBody.class));
        assertThat(request.getValue().contentType()).isEqualTo("application/octet-stream");
    }

    @Test
    void wrapsStorageFailuresWithTheBucketAndReferenceForDiagnosis() {
        when(s3.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                .thenThrow(S3Exception.builder().message("denied").build());

        assertThatThrownBy(() -> storage.store(new byte[] {1}, "jpg"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Failed to store evidence binary")
                .hasMessageContaining(BUCKET);
    }

    @Test
    void opensAnExistingObjectWithItsLengthAndContentType() throws Exception {
        GetObjectResponse response = GetObjectResponse.builder().contentLength(3L).contentType("image/png").build();
        when(s3.getObject(any(GetObjectRequest.class))).thenReturn(new ResponseInputStream<>(response,
                AbortableInputStream.create(new ByteArrayInputStream(new byte[] {7, 8, 9}))));

        EvidenceContent content = storage.open("abc.png").orElseThrow();

        ArgumentCaptor<GetObjectRequest> request = ArgumentCaptor.forClass(GetObjectRequest.class);
        verify(s3).getObject(request.capture());
        assertThat(request.getValue().bucket()).isEqualTo(BUCKET);
        assertThat(request.getValue().key()).isEqualTo("abc.png");
        assertThat(content.contentLength()).isEqualTo(3L);
        assertThat(content.contentType()).isEqualTo("image/png");
        try (var stream = content.stream()) {
            assertThat(stream.readAllBytes()).containsExactly(7, 8, 9);
        }
    }

    @Test
    void returnsEmptyWhenTheObjectDoesNotExist() {
        when(s3.getObject(any(GetObjectRequest.class))).thenThrow(NoSuchKeyException.builder().build());

        assertThat(storage.open("missing.jpg")).isEmpty();
    }

    @Test
    void returnsEmptyForBlankOrNullReferencesWithoutCallingS3() {
        assertThat(storage.open(null)).isEmpty();
        assertThat(storage.open("   ")).isEmpty();

        verify(s3, never()).getObject(any(GetObjectRequest.class));
    }
}
