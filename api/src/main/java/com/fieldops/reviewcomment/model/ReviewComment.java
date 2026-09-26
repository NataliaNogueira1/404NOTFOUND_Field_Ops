package com.fieldops.reviewcomment.model;

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

/** Immutable guidance recorded by a reviewer for one frozen checklist item. */
@Entity
@Table(name = "review_comments")
public class ReviewComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspection inspection;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspection_item_snapshot_id", nullable = false)
    private InspectionItemSnapshot itemSnapshot;

    @Column(name = "comment_text", nullable = false, columnDefinition = "TEXT")
    private String comment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ReviewComment() {
    }

    public static ReviewComment create(Inspection inspection, InspectionItemSnapshot itemSnapshot,
            String comment, User createdBy) {
        ReviewComment reviewComment = new ReviewComment();
        reviewComment.inspection = inspection;
        reviewComment.itemSnapshot = itemSnapshot;
        reviewComment.comment = comment;
        reviewComment.createdBy = createdBy;
        return reviewComment;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public Inspection getInspection() { return inspection; }
    public InspectionItemSnapshot getItemSnapshot() { return itemSnapshot; }
    public String getComment() { return comment; }
    public User getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
}
