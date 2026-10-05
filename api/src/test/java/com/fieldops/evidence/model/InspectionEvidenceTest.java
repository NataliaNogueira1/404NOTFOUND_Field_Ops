package com.fieldops.evidence.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.user.model.User;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class InspectionEvidenceTest {
    @Test
    void keepsCaptureMetadataAndTheLinkedSnapshot() {
        Inspection inspection = new Inspection();
        InspectionItemSnapshot snapshot = mock(InspectionItemSnapshot.class);
        User uploader = new User();
        Instant capturedAt = Instant.parse("2026-02-01T10:00:00Z");

        InspectionEvidence evidence = InspectionEvidence.create(inspection, snapshot, "inspection-1/photo.jpg",
                "checksum", "Panel frontal", "Area externa", capturedAt, uploader);

        assertThat(evidence.getInspection()).isSameAs(inspection);
        assertThat(evidence.getItemSnapshot()).isSameAs(snapshot);
        assertThat(evidence.getCapturedAt()).isEqualTo(capturedAt);
        assertThat(evidence.getLocation()).isEqualTo("Area externa");
    }

    @Test
    void acceptsNullLocationForExistingEvidenceRecords() {
        InspectionEvidence evidence = InspectionEvidence.create(new Inspection(), mock(InspectionItemSnapshot.class),
                "inspection-1/legacy.jpg", "checksum", "Legacy", Instant.parse("2026-02-01T10:00:00Z"), new User());

        assertThat(evidence.getLocation()).isNull();
    }
}
