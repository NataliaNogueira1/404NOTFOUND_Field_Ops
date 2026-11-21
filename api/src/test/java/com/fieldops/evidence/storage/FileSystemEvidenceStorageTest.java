package com.fieldops.evidence.storage;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class FileSystemEvidenceStorageTest {
    @TempDir Path root;

    private FileSystemEvidenceStorage storage() {
        EvidenceStorageProperties properties = new EvidenceStorageProperties();
        properties.setEvidenceDir(root);
        return new FileSystemEvidenceStorage(properties);
    }

    private byte[] read(EvidenceContent content) throws IOException {
        try (var stream = content.stream()) {
            return stream.readAllBytes();
        }
    }

    @Test
    void resolvesAStoredRelativeReferenceAndRejectsTraversalOrMissingFiles() throws Exception {
        Path file = root.resolve("inspection-1/photo.jpg");
        Files.createDirectories(file.getParent());
        Files.write(file, new byte[] {1, 2, 3});
        FileSystemEvidenceStorage storage = storage();

        EvidenceContent content = storage.open("inspection-1/photo.jpg").orElseThrow();
        assertThat(read(content)).containsExactly(1, 2, 3);
        assertThat(content.contentLength()).isEqualTo(3);
        assertThat(storage.open("../outside.jpg")).isEmpty();
        assertThat(storage.open(file.toString())).isEmpty();
        assertThat(storage.open("inspection-1/missing.jpg")).isEmpty();
        assertThat(storage.open("  ")).isEmpty();
    }

    @Test
    void hasNoTemporaryDownloadUrlBecauseTheBinaryIsOnlyServedThroughTheApi() throws Exception {
        FileSystemEvidenceStorage storage = storage();
        String reference = storage.store(new byte[] {1}, "jpg");

        assertThat(storage.temporaryDownloadUrl(reference)).isEmpty();
    }

    @Test
    void storesBytesUnderRootAndReturnsARelativeReferenceRetrievableByOpen() throws Exception {
        FileSystemEvidenceStorage storage = storage();
        byte[] content = {10, 20, 30, 40};

        String reference = storage.store(content, "jpg");

        assertThat(Path.of(reference).isAbsolute()).isFalse();
        assertThat(reference).endsWith(".jpg");
        assertThat(Files.exists(root.resolve(reference))).isTrue();
        assertThat(read(storage.open(reference).orElseThrow())).isEqualTo(content);
    }

    @Test
    void normalizesDangerousOrEmptyExtensionsSoTheStoredPathStaysUnderRoot() throws Exception {
        FileSystemEvidenceStorage storage = storage();

        String traversal = storage.store(new byte[] {1}, "../../evil");
        String dotted = storage.store(new byte[] {1}, ".jpg");
        String empty = storage.store(new byte[] {1}, "   ");

        assertThat(Files.exists(root.resolve(traversal).normalize())).isTrue();
        assertThat(root.resolve(traversal).normalize().startsWith(root)).isTrue();
        assertThat(dotted).endsWith(".jpg");
        assertThat(empty).endsWith(".bin");
    }
}
