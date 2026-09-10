package com.fieldops.inspection.model;

import jakarta.persistence.*;

@Entity
@Table(name = "template_items")
public class TemplateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private TemplateSection section;

    @Column(nullable = false, length = 500)
    private String question;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "response_type", nullable = false, length = 30)
    private ResponseType responseType;

    @Column(nullable = false)
    private boolean required;

    @Column(name = "require_observation_on_failure", nullable = false)
    private boolean requireObservationOnFailure;

    @Column(name = "require_evidence_on_failure", nullable = false)
    private boolean requireEvidenceOnFailure;

    /** JSON array of options for SINGLE_CHOICE type */
    @Column(name = "options_json", columnDefinition = "TEXT")
    private String optionsJson;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    public Long getId() { return id; }
    public TemplateSection getSection() { return section; }
    public void setSection(TemplateSection section) { this.section = section; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public ResponseType getResponseType() { return responseType; }
    public void setResponseType(ResponseType responseType) { this.responseType = responseType; }
    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }
    public boolean isRequireObservationOnFailure() { return requireObservationOnFailure; }
    public void setRequireObservationOnFailure(boolean v) { this.requireObservationOnFailure = v; }
    public boolean isRequireEvidenceOnFailure() { return requireEvidenceOnFailure; }
    public void setRequireEvidenceOnFailure(boolean v) { this.requireEvidenceOnFailure = v; }
    public String getOptionsJson() { return optionsJson; }
    public void setOptionsJson(String optionsJson) { this.optionsJson = optionsJson; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public String getOptions() { return optionsJson; }
    public void setOptions(String options) { this.optionsJson = options; }
    public Integer getSortOrder() { return displayOrder; }
    public void setSortOrder(Integer sortOrder) { this.displayOrder = sortOrder; }
}
