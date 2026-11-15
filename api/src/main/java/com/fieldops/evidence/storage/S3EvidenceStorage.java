package com.fieldops.evidence.storage;

import java.net.URI;
import java.time.Duration;
import java.util.Optional;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

/**
 * Evidence storage on a private S3 bucket (#309). The object key is the evidence reference, so
 * references persisted by the filesystem backend keep the same shape. Credentials come from the
 * SDK default chain (the EC2 instance profile), never from application configuration.
 * Wired by {@link S3EvidenceStorageConfig} when {@code fieldops.storage.type=s3}.
 */
public class S3EvidenceStorage implements EvidenceStorage {
    private final S3Client s3;
    private final S3Presigner presigner;
    private final String bucket;
    private final Duration presignTtl;

    public S3EvidenceStorage(S3Client s3, S3Presigner presigner, String bucket, Duration presignTtl) {
        this.s3 = s3;
        this.presigner = presigner;
        this.bucket = bucket;
        this.presignTtl = presignTtl;
    }

    @Override
    public Optional<TemporaryEvidenceUrl> temporaryDownloadUrl(String reference) {
        if (reference == null || reference.isBlank()) return Optional.empty();
        GetObjectPresignRequest request = GetObjectPresignRequest.builder()
                .signatureDuration(presignTtl)
                .getObjectRequest(GetObjectRequest.builder().bucket(bucket).key(reference).build())
                .build();
        PresignedGetObjectRequest presigned = presigner.presignGetObject(request);
        return Optional.of(new TemporaryEvidenceUrl(URI.create(presigned.url().toString()), presigned.expiration()));
    }

    @Override
    public Optional<EvidenceContent> open(String reference) {
        if (reference == null || reference.isBlank()) return Optional.empty();
        try {
            ResponseInputStream<GetObjectResponse> object = s3.getObject(
                    GetObjectRequest.builder().bucket(bucket).key(reference).build());
            GetObjectResponse metadata = object.response();
            return Optional.of(new EvidenceContent(object, metadata.contentLength(), metadata.contentType()));
        } catch (NoSuchKeyException missing) {
            return Optional.empty();
        }
    }

    @Override
    public String store(byte[] content, String fileExtension) {
        String reference = EvidenceReference.create(fileExtension);
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(reference)
                .contentType(contentTypeOf(reference))
                .contentLength((long) content.length)
                .build();
        try {
            s3.putObject(request, RequestBody.fromBytes(content));
        } catch (SdkException failure) {
            throw new IllegalStateException(
                    "Failed to store evidence binary in bucket " + bucket + ": " + reference, failure);
        }
        return reference;
    }

    private String contentTypeOf(String reference) {
        return MediaTypeFactory.getMediaType(reference).orElse(MediaType.APPLICATION_OCTET_STREAM).toString();
    }
}
