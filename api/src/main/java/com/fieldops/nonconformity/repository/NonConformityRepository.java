package com.fieldops.nonconformity.repository;

import com.fieldops.nonconformity.model.NonConformity;
import com.fieldops.nonconformity.model.NonConformityStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NonConformityRepository extends JpaRepository<NonConformity, Long> {

    List<NonConformity> findByInspectionIdOrderByCreatedAtAsc(Long inspectionId);

    /** Counts non-conformities without loading inspections or item snapshots. */
    @Query("""
        SELECT COUNT(n)
        FROM NonConformity n
        JOIN n.inspection i
        WHERE n.status = :status
          AND (:from IS NULL OR i.dueDate >= :from)
          AND (:to IS NULL OR i.dueDate <= :to)
          AND (:clientName IS NULL OR LOWER(i.clientName) = LOWER(:clientName))
          AND (:technicianId IS NULL OR i.technician.id = :technicianId)
    """)
    long countByStatusAndInspectionFilters(
            @Param("status") NonConformityStatus status,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("clientName") String clientName,
            @Param("technicianId") Long technicianId);
}
