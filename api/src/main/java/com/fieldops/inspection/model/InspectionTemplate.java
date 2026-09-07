package com.fieldops.inspection.model;

import jakarta.persistence.*;
import com.fieldops.user.model.User;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inspection_templates")
public class InspectionTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 100)
    private String category;

    @Column
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private InspectionTemplateStatus status = InspectionTemplateStatus.DRAFT;

    @Column(name = "current_version", nullable = false)
    private Integer currentVersion = 0;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false, updatable = false)
    private User createdBy;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<TemplateSection> sections = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Integer rowVersion;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public InspectionTemplateStatus getStatus() { return status; }
    public void setStatus(InspectionTemplateStatus status) { this.status = status; }
    public Integer getCurrentVersion() { return currentVersion; }
    public void setCurrentVersion(Integer currentVersion) { this.currentVersion = currentVersion; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public Integer getRowVersion() { return rowVersion; }
    public Integer getVersion() { return currentVersion; }
    public void setVersion(Integer version) { this.currentVersion = version; }
    public boolean isPublished() { return status == InspectionTemplateStatus.ACTIVE; }
    public void setPublished(boolean published) {
        this.status = published ? InspectionTemplateStatus.ACTIVE : InspectionTemplateStatus.DRAFT;
    }
    public List<TemplateSection> getSections() { return sections; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
