package com.fieldops.inspection.dto;

import java.time.Instant;

/**
 * A single one-shot GPS reading captured by the mobile app (PBI-045 / RN-062).
 *
 * <p>Every field is nullable so a partial or missing reading never blocks the
 * transition: the technician may skip or be denied the location permission and
 * still proceed (RN-059).</p>
 */
public record CapturedLocation(
        Double latitude,
        Double longitude,
        Double accuracy,
        Instant capturedAt) {

    /** True when there is at least a latitude/longitude pair worth persisting. */
    public boolean hasCoordinates() {
        return latitude != null && longitude != null;
    }
}
