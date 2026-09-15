package com.fieldops.inspection.model;

import com.fieldops.user.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "inspection_template_versions")
public class InspectionTemplateVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id", nullable = false, updatable = false)
    private InspectionTemplate template;

    @Column(name = "version_number", nullable = false, updatable = false)
    private Integer versionNumber;

    @Column(name = "title_snapshot", nullable = false, length = 200, updatable = false)
    private String titleSnapshot;

    @Column(name = "description_snapshot", columnDefinition = "TEXT", updatable = false)
    private String descriptionSnapshot;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "published_by", nullable = false, updatable = false)
    private User publishedBy;

    @Column(name = "published_at", nullable = false, updatable = false)
    private Instant publishedAt;

    protected InspectionTemplateVersion() {}

    public static InspectionTemplateVersion publish(InspectionTemplate template, int versionNumber,
            User publisher, Instant publishedAt) {
        InspectionTemplateVersion version = new InspectionTemplateVersion();
        version.template = template;
        version.versionNumber = versionNumber;
        version.titleSnapshot = template.getTitle();
        version.descriptionSnapshot = template.getDescription();
        version.publishedBy = publisher;
        version.publishedAt = publishedAt;
        return version;
    }

    public Long getId() { return id; }
    public InspectionTemplate getTemplate() { return template; }
    public Integer getVersionNumber() { return versionNumber; }
    public String getTitleSnapshot() { return titleSnapshot; }
    public String getDescriptionSnapshot() { return descriptionSnapshot; }
    public User getPublishedBy() { return publishedBy; }
    public Instant getPublishedAt() { return publishedAt; }
    public boolean isPublished() {
        return versionNumber != null && versionNumber > 0 && publishedBy != null && publishedAt != null;
    }
}
