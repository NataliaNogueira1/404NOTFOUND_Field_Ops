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
}
