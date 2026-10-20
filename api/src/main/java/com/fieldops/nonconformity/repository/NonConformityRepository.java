package com.fieldops.nonconformity.repository;

import com.fieldops.nonconformity.model.NonConformity;
import com.fieldops.nonconformity.model.NonConformitySeverity;
import com.fieldops.nonconformity.model.NonConformityStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NonConformityRepository extends JpaRepository<NonConformity, Long> {

    List<NonConformity> findByInspectionIdOrderByCreatedAtAsc(Long inspectionId);

    /**
     * Lists non-conformities with optional filters, fetching the owning inspection to avoid N+1
     * when the response reads its denormalized client name (PBI-228). {@code clientName} must be
     * pre-lowercased by the caller; wrapping {@code LOWER(:clientName)} in JPQL would make Postgres
     * bind a NULL as bytea and fail.
     */
    @Query(value = """
        SELECT n FROM NonConformity n
        JOIN FETCH n.inspection i
        WHERE (:inspectionId IS NULL OR i.id = :inspectionId)
          AND (:clientName IS NULL OR LOWER(i.clientName) = :clientName)
          AND (:severity IS NULL OR n.severity = :severity)
          AND (:status IS NULL OR n.status = :status)
        """,
            countQuery = """
        SELECT COUNT(n) FROM NonConformity n
        JOIN n.inspection i
        WHERE (:inspectionId IS NULL OR i.id = :inspectionId)
          AND (:clientName IS NULL OR LOWER(i.clientName) = :clientName)
          AND (:severity IS NULL OR n.severity = :severity)
          AND (:status IS NULL OR n.status = :status)
        """)
    Page<NonConformity> search(
            @Param("inspectionId") Long inspectionId,
            @Param("clientName") String clientName,
            @Param("severity") NonConformitySeverity severity,
            @Param("status") NonConformityStatus status,
            Pageable pageable);

    @Query("""
        SELECT n.inspection.id, COUNT(n)
        FROM NonConformity n
        WHERE n.inspection.id IN :inspectionIds
        GROUP BY n.inspection.id
    """)
    List<Object[]> countByInspectionIds(@Param("inspectionIds") List<Long> inspectionIds);

    /** Counts non-conformities without loading inspections or item snapshots. */
    @Query("""
        SELECT COUNT(n)
        FROM NonConformity n
        JOIN n.inspection i
        WHERE n.status = :status
          AND (CAST(:from AS date) IS NULL OR i.dueDate >= :from)
          AND (CAST(:to AS date) IS NULL OR i.dueDate <= :to)
          AND (CAST(:clientName AS string) IS NULL OR LOWER(i.clientName) = :clientName)
          AND (CAST(:technicianId AS long) IS NULL OR i.technician.id = :technicianId)
    """)
    long countByStatusAndInspectionFilters(
            @Param("status") NonConformityStatus status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("clientName") String clientName,
            @Param("technicianId") Long technicianId);
}
