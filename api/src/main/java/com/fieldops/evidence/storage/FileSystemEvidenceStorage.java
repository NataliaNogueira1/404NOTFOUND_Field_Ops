package com.fieldops.evidence.storage;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/** Local-disk evidence storage; the default for dev and tests (selected unless {@code fieldops.storage.type=s3}). */
@Service
@ConditionalOnProperty(name = "fieldops.storage.type", havingValue = "filesystem", matchIfMissing = true)
public class FileSystemEvidenceStorage implements EvidenceStorage {
    private final Path root;

    public FileSystemEvidenceStorage(EvidenceStorageProperties properties) {
        this.root = properties.getEvidenceDir().toAbsolutePath().normalize();
    }

    @Override
    public Optional<EvidenceContent> open(String reference) {
        return resolve(reference).map(this::toContent);
    }

    private Optional<Path> resolve(String reference) {
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

    /** Local files have no public address; the API streams them through {@link #open(String)}. */
    @Override
    public Optional<TemporaryEvidenceUrl> temporaryDownloadUrl(String reference) {
        return Optional.empty();
    }

    private EvidenceContent toContent(Path file) {
        try {
            return new EvidenceContent(Files.newInputStream(file), Files.size(file), Files.probeContentType(file));
        } catch (IOException exception) {
            throw new UncheckedIOException("Failed to open evidence binary: " + file.getFileName(), exception);
        }
    }

    @Override
    public String store(byte[] content, String fileExtension) {
        String reference = EvidenceReference.create(fileExtension);
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
}
