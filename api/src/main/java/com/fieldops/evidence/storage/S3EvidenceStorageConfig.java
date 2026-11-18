package com.fieldops.evidence.storage;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

/** Registers the S3 evidence backend only when {@code fieldops.storage.type=s3}. */
@Configuration
@ConditionalOnProperty(name = "fieldops.storage.type", havingValue = "s3")
public class S3EvidenceStorageConfig {

    @Bean
    @ConfigurationProperties(prefix = "fieldops.storage.s3")
    S3StorageProperties s3StorageProperties() {
        return new S3StorageProperties();
    }

    /** Uses the SDK default credential chain, which resolves the EC2 instance profile (LabRole). */
    @Bean(destroyMethod = "close")
    S3Client s3Client(S3StorageProperties properties) {
        return S3Client.builder().region(Region.of(properties.getRegion())).build();
    }

    @Bean
    S3EvidenceStorage s3EvidenceStorage(S3Client s3Client, S3StorageProperties properties) {
        return new S3EvidenceStorage(s3Client, properties.getBucket());
    }
}
