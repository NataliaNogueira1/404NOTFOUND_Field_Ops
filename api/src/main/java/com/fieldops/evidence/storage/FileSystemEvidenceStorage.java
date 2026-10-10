package com.fieldops.evidence.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
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
}
