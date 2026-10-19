package com.fieldops.evidence.storage;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class FileSystemEvidenceStorageTest {
    @TempDir Path root;

    @Test
    void resolvesAStoredRelativeReferenceAndRejectsTraversalOrMissingFiles() throws Exception {
        Path file = root.resolve("inspection-1/photo.jpg");
        Files.createDirectories(file.getParent());
        Files.write(file, new byte[] {1, 2, 3});
        EvidenceStorageProperties properties = new EvidenceStorageProperties();
        properties.setEvidenceDir(root);
        FileSystemEvidenceStorage storage = new FileSystemEvidenceStorage(properties);

        assertThat(storage.find("inspection-1/photo.jpg")).contains(file);
        assertThat(storage.find("../outside.jpg")).isEmpty();
        assertThat(storage.find(root.resolve("inspection-1/photo.jpg").toString())).isEmpty();
        assertThat(storage.find("inspection-1/missing.jpg")).isEmpty();
    }

    @Test
    void storesBytesUnderRootAndReturnsARelativeReferenceRetrievableByFind() throws Exception {
        EvidenceStorageProperties properties = new EvidenceStorageProperties();
        properties.setEvidenceDir(root);
        FileSystemEvidenceStorage storage = new FileSystemEvidenceStorage(properties);
        byte[] content = {10, 20, 30, 40};

        String reference = storage.store(content, "jpg");

        assertThat(Path.of(reference).isAbsolute()).isFalse();
        assertThat(reference).endsWith(".jpg");
        Path stored = storage.find(reference).orElseThrow();
        assertThat(stored.startsWith(root)).isTrue();
        assertThat(Files.readAllBytes(stored)).isEqualTo(content);
    }

    @Test
    void normalizesDangerousOrEmptyExtensionsSoTheStoredPathStaysUnderRoot() throws Exception {
        EvidenceStorageProperties properties = new EvidenceStorageProperties();
        properties.setEvidenceDir(root);
        FileSystemEvidenceStorage storage = new FileSystemEvidenceStorage(properties);

        String traversal = storage.store(new byte[] {1}, "../../evil");
        String dotted = storage.store(new byte[] {1}, ".jpg");
        String empty = storage.store(new byte[] {1}, "   ");

        assertThat(storage.find(traversal)).isPresent();
        assertThat(storage.find(traversal).orElseThrow().startsWith(root)).isTrue();
        assertThat(dotted).endsWith(".jpg");
        assertThat(empty).endsWith(".bin");
    }
}
