package com.fieldops.evidence.storage;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.validation.annotation.Validated;

/**
 * Settings of the S3 evidence backend ({@code fieldops.storage.s3.*}). Bound only when the S3
 * backend is selected, so a missing bucket fails startup there and never affects dev/test.
 */
@Validated
public class S3StorageProperties {
    @NotBlank(message = "fieldops.storage.s3.bucket (EVIDENCE_S3_BUCKET) is required when fieldops.storage.type=s3")
    private String bucket;

    @NotBlank
    private String region = "us-east-1";

    /** How long a presigned download URL stays valid (#310). Short on purpose: it is a bearer link. */
    @NotNull
    private Duration presignTtl = Duration.ofMinutes(5);

    public String getBucket() { return bucket; }
    public void setBucket(String bucket) { this.bucket = bucket; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public Duration getPresignTtl() { return presignTtl; }
    public void setPresignTtl(Duration presignTtl) { this.presignTtl = presignTtl; }
}
