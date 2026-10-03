package com.fieldops.evidence.storage;

import java.nio.file.Path;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "fieldops.storage")
public class EvidenceStorageProperties {
    private Path evidenceDir = Path.of("./evidences");

    public Path getEvidenceDir() { return evidenceDir; }
    public void setEvidenceDir(Path evidenceDir) { this.evidenceDir = evidenceDir; }
}
