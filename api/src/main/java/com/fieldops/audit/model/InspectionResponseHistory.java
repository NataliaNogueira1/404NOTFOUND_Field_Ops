package com.fieldops.audit.model;

import com.fieldops.inspection.model.ResponseType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Immutable record of one checklist answer version (PBI-088).
 *
 * <p>Complements the state-change trail of PBI-063 ({@link AuditEvent}): that entity records
 * inspection status transitions, this one records the content of every answer version (item,
 * section, value, observation, author, timestamp). Following the same append-only design as the
 * audit trail, there are intentionally no setters: once created, a row never changes. Each new
 * answer (or re-answer) appends a new row, preserving the full chronological history of an item.
 */
@Entity
@Table(name = "inspection_response_history")
public class InspectionResponseHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "inspection_id", nullable = false, updatable = false)
    private Long inspectionId;

    @Column(name = "item_id", nullable = false, updatable = false)
    private Long itemId;

    @Column(name = "section_title", nullable = false, length = 200, updatable = false)
    private String sectionTitle;

    @Column(name = "section_order", nullable = false, updatable = false)
    private Integer sectionOrder;

    @Column(name = "item_title", nullable = false, length = 500, updatable = false)
    private String itemTitle;

    @Column(name = "item_order", nullable = false, updatable = false)
    private Integer itemOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "response_type", nullable = false, length = 30, updatable = false)
    private ResponseType responseType;

    @Column(name = "answer_value", columnDefinition = "TEXT", updatable = false)
    private String value;

    @Column(name = "observation", columnDefinition = "TEXT", updatable = false)
    private String observation;

    @Column(name = "answered_by", updatable = false)
    private Long answeredBy;

    @Column(name = "answered_at", nullable = false, updatable = false)
    private Instant answeredAt;

    protected InspectionResponseHistory() {
    }

    private InspectionResponseHistory(Long inspectionId, Long itemId, String sectionTitle, Integer sectionOrder,
            String itemTitle, Integer itemOrder, ResponseType responseType, String value, String observation,
            Long answeredBy, Instant answeredAt) {
        this.inspectionId = inspectionId;
        this.itemId = itemId;
        this.sectionTitle = sectionTitle;
        this.sectionOrder = sectionOrder;
        this.itemTitle = itemTitle;
        this.itemOrder = itemOrder;
        this.responseType = responseType;
        this.value = value;
        this.observation = observation;
        this.answeredBy = answeredBy;
        this.answeredAt = answeredAt;
    }

    /** Factory for a new answer-history entry. {@code answeredAt} defaults to now on persist. */
    public static InspectionResponseHistory of(Long inspectionId, Long itemId, String sectionTitle,
            Integer sectionOrder, String itemTitle, Integer itemOrder, ResponseType responseType, String value,
            String observation, Long answeredBy, Instant answeredAt) {
        return new InspectionResponseHistory(inspectionId, itemId, sectionTitle, sectionOrder, itemTitle,
                itemOrder, responseType, value, observation, answeredBy, answeredAt);
    }

    @PrePersist
    void onCreate() {
        if (answeredAt == null) {
            answeredAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Long getInspectionId() {
        return inspectionId;
    }

    public Long getItemId() {
        return itemId;
    }

    public String getSectionTitle() {
        return sectionTitle;
    }

    public Integer getSectionOrder() {
        return sectionOrder;
    }

    public String getItemTitle() {
        return itemTitle;
    }

    public Integer getItemOrder() {
        return itemOrder;
    }

    public ResponseType getResponseType() {
        return responseType;
    }

    public String getValue() {
        return value;
    }

    public String getObservation() {
        return observation;
    }

    public Long getAnsweredBy() {
        return answeredBy;
    }

    public Instant getAnsweredAt() {
        return answeredAt;
    }
}
