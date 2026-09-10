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

    @Column(name = "source_template_item_id", nullable = false, updatable = false)
    private Long sourceTemplateItemId;

    @Column(name = "section_title", nullable = false, length = 200, updatable = false)
    private String sectionTitle;

    @Column(name = "section_order", nullable = false, updatable = false)
    private Integer sectionOrder;

    @Column(name = "item_code", length = 100, updatable = false)
    private String itemCode;

    @Column(name = "item_title", nullable = false, length = 500, updatable = false)
    private String itemTitle;

    @Column(name = "item_description", length = 1000, updatable = false)
    private String itemDescription;

    @jakarta.persistence.Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(name = "response_type", nullable = false, length = 30, updatable = false)
    private ResponseType responseType;

    @Column(nullable = false, updatable = false)
    private boolean required;

    @Column(name = "rules_json", nullable = false, columnDefinition = "TEXT")
    private String rulesJson;

    @Column(name = "options_json", columnDefinition = "TEXT", updatable = false)
    private String optionsJson;

    @Column(name = "item_order", nullable = false, updatable = false)
    private Integer itemOrder;

    protected InspectionItemSnapshot() {}

    public static InspectionItemSnapshot from(Inspection inspection, TemplateSection section, TemplateItem item) {
        InspectionItemSnapshot snapshot = new InspectionItemSnapshot();
        snapshot.inspection = inspection;
        snapshot.sourceTemplateItemId = item.getId();
        snapshot.sectionTitle = section.getTitle();
        snapshot.sectionOrder = section.getDisplayOrder();
        snapshot.itemCode = item.getCode();
        snapshot.itemTitle = item.getQuestion();
        snapshot.itemDescription = item.getDescription();
        snapshot.responseType = item.getResponseType();
        snapshot.required = item.isRequired();
        snapshot.rulesJson = rulesJson(item);
        snapshot.optionsJson = item.getOptionsJson();
        snapshot.itemOrder = item.getDisplayOrder();
        return snapshot;
    }

    private static String rulesJson(TemplateItem item) {
        return "{\"required\":" + item.isRequired()
                + ",\"observationRequiredOnFailure\":" + item.isObservationRequiredOnFailure()
                + ",\"evidenceRequiredOnFailure\":" + item.isEvidenceRequiredOnFailure() + "}";
    }

    public Long getId() { return id; }
    public Inspection getInspection() { return inspection; }
    public Long getSourceTemplateItemId() { return sourceTemplateItemId; }
    public Long getTemplateItemId() { return sourceTemplateItemId; }
    public String getSectionTitle() { return sectionTitle; }
    public Integer getSectionOrder() { return sectionOrder; }
    public String getItemCode() { return itemCode; }
    public String getItemTitle() { return itemTitle; }
    public String getItemDescription() { return itemDescription; }
    public ResponseType getResponseType() { return responseType; }
    public boolean isRequired() { return required; }
    public String getRulesJson() { return rulesJson; }
    public String getOptionsJson() { return optionsJson; }
    public Integer getItemOrder() { return itemOrder; }
}
