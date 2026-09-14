package com.fieldops.inspection.model;

import com.fieldops.user.model.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inspections")
public class Inspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private InspectionTemplate template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_version_id")
    private InspectionTemplateVersion templateVersion;

    @Column(name = "client_name", nullable = false, length = 200)
    private String clientName;

    @Column(name = "site_name", nullable = false, length = 200)
    private String siteName;

    @Column(name = "equipment_name", nullable = false, length = 200)
    private String equipmentName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id", nullable = false)
    private User technician;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supervisor_id", nullable = false)
    private User supervisor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InspectionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Priority priority;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "due_time")
    private LocalTime dueTime;

    @Column(name = "supervisor_instructions", columnDefinition = "TEXT")
    private String supervisorInstructions;

    @Column(nullable = false)
    private Integer progress = 0;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "canceled_at")
    private Instant canceledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canceled_by")
    private User canceledBy;

    @Column(name = "canceled_reason", columnDefinition = "TEXT")
    private String canceledReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InspectionItemSnapshot> itemSnapshots = new ArrayList<>();

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

    // Getters and Setters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public InspectionTemplate getTemplate() { return template; }
    public void setTemplate(InspectionTemplate template) { this.template = template; }
    public InspectionTemplateVersion getTemplateVersion() { return templateVersion; }
    public void setTemplateVersion(InspectionTemplateVersion templateVersion) { this.templateVersion = templateVersion; }
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public String getSiteName() { return siteName; }
    public void setSiteName(String siteName) { this.siteName = siteName; }
    public String getEquipmentName() { return equipmentName; }
    public void setEquipmentName(String equipmentName) { this.equipmentName = equipmentName; }
    public User getTechnician() { return technician; }
    public void setTechnician(User technician) { this.technician = technician; }
    public User getSupervisor() { return supervisor; }
    public void setSupervisor(User supervisor) { this.supervisor = supervisor; }
    public InspectionStatus getStatus() { return status; }
    public void setStatus(InspectionStatus status) { this.status = status; }
    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public LocalTime getDueTime() { return dueTime; }
    public void setDueTime(LocalTime dueTime) { this.dueTime = dueTime; }
    public String getSupervisorInstructions() { return supervisorInstructions; }
    public void setSupervisorInstructions(String supervisorInstructions) { this.supervisorInstructions = supervisorInstructions; }
    public Integer getProgress() { return progress; }
    public void setProgress(Integer progress) { this.progress = progress; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getCanceledAt() { return canceledAt; }
    public void setCanceledAt(Instant canceledAt) { this.canceledAt = canceledAt; }
    public User getCanceledBy() { return canceledBy; }
    public void setCanceledBy(User canceledBy) { this.canceledBy = canceledBy; }
    public String getCanceledReason() { return canceledReason; }
    public void setCanceledReason(String canceledReason) { this.canceledReason = canceledReason; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<InspectionItemSnapshot> getItemSnapshots() { return itemSnapshots; }
    public void addItemSnapshot(InspectionItemSnapshot snapshot) { itemSnapshots.add(snapshot); }
}
