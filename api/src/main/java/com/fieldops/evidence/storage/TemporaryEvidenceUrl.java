package com.fieldops.evidence.storage;

import java.net.URI;
import java.time.Instant;

/**
 * A short-lived URL that lets a client download an evidence binary directly from the storage
 * backend, without proxying the bytes through the API. It is a bearer link: anyone holding it can
 * read the object until {@code expiresAt}, so it must never be logged or persisted.
 */
public record TemporaryEvidenceUrl(URI url, Instant expiresAt) {
}
