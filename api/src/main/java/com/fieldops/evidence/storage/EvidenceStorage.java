package com.fieldops.evidence.storage;

import java.nio.file.Path;
import java.util.Optional;

/** Resolves and persists evidence binaries without exposing the configured storage directory. */
public interface EvidenceStorage {

    Optional<Path> find(String reference);

    /**
     * Writes the binary under the storage root and returns a relative reference that
     * {@link #find(String)} can later resolve. The {@code fileExtension} is a caller-derived
     * suffix (e.g. {@code jpg}); it is sanitized and never trusted as a path.
     */
    String store(byte[] content, String fileExtension);
}
