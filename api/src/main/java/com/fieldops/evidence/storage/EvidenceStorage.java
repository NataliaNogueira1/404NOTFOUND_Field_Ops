package com.fieldops.evidence.storage;

import java.nio.file.Path;
import java.util.Optional;

/** Resolves database evidence references without exposing the configured storage directory. */
public interface EvidenceStorage {
    Optional<Path> find(String reference);
}
