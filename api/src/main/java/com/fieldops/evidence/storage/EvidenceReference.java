package com.fieldops.evidence.storage;

import java.util.UUID;

/**
 * Builds the opaque reference persisted for an evidence binary, shared by every storage backend
 * so a reference stored in the database stays valid after switching backends.
 */
final class EvidenceReference {

    private EvidenceReference() {
    }

    /** Returns {@code <uuid>.<extension>} with the extension reduced to lowercase ASCII alphanumerics. */
    static String create(String fileExtension) {
        return UUID.randomUUID() + "." + sanitizeExtension(fileExtension);
    }

    /** Keeps only ASCII alphanumerics so the extension can never introduce a path segment or key prefix. */
    private static String sanitizeExtension(String fileExtension) {
        if (fileExtension == null) return "bin";
        String normalized = fileExtension.replaceAll("[^A-Za-z0-9]", "");
        return normalized.isBlank() ? "bin" : normalized.toLowerCase();
    }
}
