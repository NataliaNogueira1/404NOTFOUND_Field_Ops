package com.fieldops.inspection.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "inspection_item_snapshots")
public class InspectionItemSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspection inspection;

    @Column(name = "template_item_id", nullable = false)
    private Long templateItemId;

    @Column(name = "rules_json", nullable = false, columnDefinition = "TEXT")
    private String rulesJson;

    protected InspectionItemSnapshot() {}

    static InspectionItemSnapshot from(Inspection inspection, TemplateItem item) {
        InspectionItemSnapshot snapshot = new InspectionItemSnapshot();
        snapshot.inspection = inspection;
        snapshot.templateItemId = item.getId();
        snapshot.rulesJson = rulesJson(item);
        return snapshot;
    }

    private static String rulesJson(TemplateItem item) {
        return "{\"required\":" + item.isRequired()
                + ",\"observationRequiredOnFailure\":" + item.isObservationRequiredOnFailure()
                + ",\"evidenceRequiredOnFailure\":" + item.isEvidenceRequiredOnFailure() + "}";
    }

    public Long getId() { return id; }
    public Inspection getInspection() { return inspection; }
    public Long getTemplateItemId() { return templateItemId; }
    public String getRulesJson() { return rulesJson; }
}
