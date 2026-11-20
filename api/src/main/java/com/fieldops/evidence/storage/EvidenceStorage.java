package com.fieldops.evidence.storage;

import java.util.Optional;

/** Resolves and persists evidence binaries without exposing where they are physically stored. */
public interface EvidenceStorage {

    /**
     * Opens the binary behind a reference returned by {@link #store(byte[], String)}.
     * Empty when the reference is blank, unsafe or has no stored binary.
     */
    Optional<EvidenceContent> open(String reference);

    /**
     * Creates a short-lived direct download URL for the binary behind a reference (#310). Empty
     * when the backend cannot hand out direct links (e.g. local disk) or the reference is blank;
     * callers then serve the bytes through {@link #open(String)}. It does not check that the
     * binary exists: a link to a missing object fails at the storage backend.
     */
    Optional<TemporaryEvidenceUrl> temporaryDownloadUrl(String reference);

    /**
     * Persists the binary and returns an opaque reference that {@link #open(String)} can later
     * resolve. The {@code fileExtension} is a caller-derived suffix (e.g. {@code jpg}); it is
     * sanitized and never trusted as a path or object key.
     */
    String store(byte[] content, String fileExtension);
}
