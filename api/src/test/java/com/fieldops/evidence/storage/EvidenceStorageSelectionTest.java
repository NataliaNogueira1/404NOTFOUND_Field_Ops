package com.fieldops.evidence.storage;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.autoconfigure.validation.ValidationAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class EvidenceStorageSelectionTest {
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(
                    ConfigurationPropertiesAutoConfiguration.class, ValidationAutoConfiguration.class))
            .withUserConfiguration(FileSystemEvidenceStorage.class, S3EvidenceStorageConfig.class)
            .withBean(EvidenceStorageProperties.class);

    @Test
    void usesTheFilesystemBackendWhenNoTypeIsConfigured() {
        runner.run(context -> {
            assertThat(context).hasSingleBean(EvidenceStorage.class);
            assertThat(context).hasSingleBean(FileSystemEvidenceStorage.class);
            assertThat(context).doesNotHaveBean(S3EvidenceStorage.class);
        });
    }

    @Test
    void usesTheFilesystemBackendWhenTypeIsFilesystem() {
        runner.withPropertyValues("fieldops.storage.type=filesystem").run(context -> {
            assertThat(context).hasSingleBean(FileSystemEvidenceStorage.class);
            assertThat(context).doesNotHaveBean(S3EvidenceStorage.class);
        });
    }

    @Test
    void usesTheS3BackendWhenTypeIsS3() {
        runner.withPropertyValues("fieldops.storage.type=s3", "fieldops.storage.s3.bucket=fieldops-evidencias-test",
                "fieldops.storage.s3.region=us-east-1").run(context -> {
                    assertThat(context).hasSingleBean(EvidenceStorage.class);
                    assertThat(context).hasSingleBean(S3EvidenceStorage.class);
                    assertThat(context).doesNotHaveBean(FileSystemEvidenceStorage.class);
                });
    }

    @Test
    void failsStartupWhenTheS3BackendHasNoBucket() {
        runner.withPropertyValues("fieldops.storage.type=s3").run(context -> {
            assertThat(context).hasFailed();
            assertThat(context.getStartupFailure()).hasStackTraceContaining("EVIDENCE_S3_BUCKET");
        });
    }
}
