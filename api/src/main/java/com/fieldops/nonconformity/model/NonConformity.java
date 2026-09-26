package com.fieldops.nonconformity.model;

import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionItemSnapshot;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

/** A problem identified during an inspection, optionally tied to a checklist item snapshot. */
@Entity
@Table(name = "non_conformities")
public class NonConformity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspection inspection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_item_snapshot_id")
    private InspectionItemSnapshot inspectionItemSnapshot;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NonConformitySeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private NonConformityStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    protected NonConformity() {
    }

    public Long getId() { return id; }
    public Inspection getInspection() { return inspection; }
    public InspectionItemSnapshot getInspectionItemSnapshot() { return inspectionItemSnapshot; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public NonConformitySeverity getSeverity() { return severity; }
    public NonConformityStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getClosedAt() { return closedAt; }
}
