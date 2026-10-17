package com.fieldops.evidence.storage;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class FileSystemEvidenceStorage implements EvidenceStorage {
    private final Path root;

    public FileSystemEvidenceStorage(EvidenceStorageProperties properties) {
        this.root = properties.getEvidenceDir().toAbsolutePath().normalize();
    }

    @Override
    public Optional<Path> find(String reference) {
        if (reference == null || reference.isBlank()) return Optional.empty();
        Path candidate;
        try {
            Path relative = Path.of(reference);
            if (relative.isAbsolute()) return Optional.empty();
            candidate = root.resolve(relative).normalize();
        } catch (RuntimeException ignored) {
            return Optional.empty();
        }
        if (!candidate.startsWith(root) || !Files.isRegularFile(candidate)) return Optional.empty();
        return Optional.of(candidate);
    }

    @Override
    public String store(byte[] content, String fileExtension) {
        String reference = UUID.randomUUID() + "." + sanitizeExtension(fileExtension);
        Path target = root.resolve(reference).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalStateException("Resolved evidence path escapes the storage root: " + reference);
        }
        try {
            Files.createDirectories(root);
            Files.write(target, content);
        } catch (IOException exception) {
            throw new UncheckedIOException("Failed to store evidence binary: " + reference, exception);
        }
        return reference;
    }

    /** Keeps only ASCII alphanumerics so the extension can never introduce a path segment. */
    private String sanitizeExtension(String fileExtension) {
        if (fileExtension == null) return "bin";
        String normalized = fileExtension.replaceAll("[^A-Za-z0-9]", "");
        return normalized.isBlank() ? "bin" : normalized.toLowerCase();
    }
}
