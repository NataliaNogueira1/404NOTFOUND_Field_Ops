package com.fieldops.answer.model;

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

/** Immutable record of one answer submitted for an inspection checklist item. */
@Entity
@Table(name = "inspection_answers")
public class InspectionAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspection inspection;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspection_item_snapshot_id", nullable = false)
    private InspectionItemSnapshot itemSnapshot;

    @Column(name = "answer_value", nullable = false, columnDefinition = "TEXT")
    private String value;

    @Column(columnDefinition = "TEXT")
    private String observation;

    @Column(name = "answered_at", nullable = false, updatable = false)
    private Instant answeredAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "answered_by", nullable = false)
    private User answeredBy;

    protected InspectionAnswer() {
    }

    public static InspectionAnswer create(Inspection inspection, InspectionItemSnapshot itemSnapshot,
            String value, String observation, User answeredBy) {
        InspectionAnswer answer = new InspectionAnswer();
        answer.inspection = inspection;
        answer.itemSnapshot = itemSnapshot;
        answer.value = value;
        answer.observation = observation;
        answer.answeredBy = answeredBy;
        return answer;
    }

    @PrePersist
    void onCreate() {
        answeredAt = Instant.now();
    }

    public Long getId() { return id; }
    public Inspection getInspection() { return inspection; }
    public InspectionItemSnapshot getItemSnapshot() { return itemSnapshot; }
    public String getValue() { return value; }
    public String getObservation() { return observation; }
    public Instant getAnsweredAt() { return answeredAt; }
    public User getAnsweredBy() { return answeredBy; }
}
