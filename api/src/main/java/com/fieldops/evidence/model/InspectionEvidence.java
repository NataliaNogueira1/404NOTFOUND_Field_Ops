package com.fieldops.evidence.model;

import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import com.fieldops.user.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

/** Immutable reference and checksum for evidence stored outside the transactional database. */
@Entity
@Table(name = "inspection_evidences")
public class InspectionEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspection inspection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_item_snapshot_id")
    private InspectionItemSnapshot itemSnapshot;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reference;

    @Column(nullable = false, length = 128)
    private String checksum;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "captured_at", nullable = false, updatable = false)
    private Instant capturedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected InspectionEvidence() {
    }

    public static InspectionEvidence create(Inspection inspection, InspectionItemSnapshot itemSnapshot,
            String reference, String checksum, String description, Instant capturedAt, User uploadedBy) {
        InspectionEvidence evidence = new InspectionEvidence();
        evidence.inspection = inspection;
        evidence.itemSnapshot = itemSnapshot;
        evidence.reference = reference;
        evidence.checksum = checksum;
        evidence.description = description;
        evidence.capturedAt = capturedAt;
        evidence.uploadedBy = uploadedBy;
        return evidence;
    }

    @PrePersist
    void onCreate() {
        if (capturedAt == null) {
            capturedAt = Instant.now();
        }
        createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public Inspection getInspection() { return inspection; }
    public InspectionItemSnapshot getItemSnapshot() { return itemSnapshot; }
    public String getReference() { return reference; }
    public String getChecksum() { return checksum; }
    public String getDescription() { return description; }
    public Instant getCapturedAt() { return capturedAt; }
    public User getUploadedBy() { return uploadedBy; }
    public Instant getCreatedAt() { return createdAt; }
}
