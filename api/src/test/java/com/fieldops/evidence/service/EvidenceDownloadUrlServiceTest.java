package com.fieldops.evidence.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fieldops.evidence.dto.EvidenceDownloadUrlResponse;
import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.evidence.storage.EvidenceStorage;
import com.fieldops.evidence.storage.TemporaryEvidenceUrl;
import com.fieldops.shared.exception.ResourceNotFoundException;
import java.net.URI;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class EvidenceDownloadUrlServiceTest {
    private InspectionEvidenceRepository repository;
    private EvidenceStorage storage;
    private EvidenceDownloadUrlService service;

    @BeforeEach
    void setUp() {
        repository = mock(InspectionEvidenceRepository.class);
        storage = mock(EvidenceStorage.class);
        service = new EvidenceDownloadUrlService(repository, storage);
        InspectionEvidence evidence = mock(InspectionEvidence.class);
        when(evidence.getId()).thenReturn(900L);
        when(evidence.getReference()).thenReturn("abc.png");
        when(repository.findById(900L)).thenReturn(Optional.of(evidence));
    }

    @Test
    void returnsTheStorageTemporaryUrlWhenTheBackendCanPresign() {
        Instant expiresAt = Instant.parse("2026-11-15T10:05:00Z");
        when(storage.temporaryDownloadUrl("abc.png")).thenReturn(Optional.of(
                new TemporaryEvidenceUrl(URI.create("https://bucket.s3.amazonaws.com/abc.png?X-Amz-Signature=x"), expiresAt)));

        EvidenceDownloadUrlResponse response = service.resolve(900L);

        assertThat(response.presigned()).isTrue();
        assertThat(response.url()).isEqualTo("https://bucket.s3.amazonaws.com/abc.png?X-Amz-Signature=x");
        assertThat(response.expiresAt()).isEqualTo(expiresAt);
    }

    @Test
    void fallsBackToTheAuthenticatedContentEndpointWhenTheBackendCannotPresign() {
        when(storage.temporaryDownloadUrl("abc.png")).thenReturn(Optional.empty());

        EvidenceDownloadUrlResponse response = service.resolve(900L);

        assertThat(response.presigned()).isFalse();
        assertThat(response.url()).isEqualTo("/api/v1/inspection-evidences/900/content");
        assertThat(response.expiresAt()).isNull();
    }

    @Test
    void failsWithNotFoundWhenTheEvidenceDoesNotExist() {
        when(repository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.resolve(404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("404");
    }
}
