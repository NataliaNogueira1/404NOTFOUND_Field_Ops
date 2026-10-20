package com.fieldops.inspection.repository;

import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface InspectionRepository extends JpaRepository<Inspection, Long>, JpaSpecificationExecutor<Inspection> {

    @Query("""
        SELECT i FROM Inspection i
        JOIN FETCH i.template t
        JOIN FETCH i.technician
        JOIN FETCH i.supervisor
        WHERE i.technician.id = :technicianId
        AND i.status IN :statuses
        ORDER BY i.dueDate ASC, i.dueTime ASC
    """)
    List<Inspection> findByTechnicianAndStatuses(
            @Param("technicianId") Long technicianId,
            @Param("statuses") List<InspectionStatus> statuses
    );

    List<Inspection> findByTechnicianIdOrderByDueDateAsc(Long technicianId);

    /**
     * Incremental pull delta for a technician (PBI-053), ordered by the monotonic pair
     * {@code (updatedAt ASC, id ASC)}. Returns only rows STRICTLY after the cursor pair
     * {@code (:cursorUpdatedAt, :cursorId)} — i.e. a newer {@code updatedAt}, or the same
     * {@code updatedAt} with a greater {@code id} — so a resumed pull never repeats or skips
     * a row. First sync passes {@code (Instant.EPOCH, 0)} to take everything.
     *
     * <p>JOIN FETCH only the to-one relations the DTO reads, to avoid N+1 (open-in-view is
     * off). The {@code itemSnapshots} collection is intentionally NOT fetch-joined here:
     * fetch-joining a collection together with {@link Pageable} forces in-memory pagination
     * (Hibernate HHH000104); it loads lazily inside the read transaction instead.
     */
    @Query("""
        SELECT i FROM Inspection i
        JOIN FETCH i.template
        LEFT JOIN FETCH i.templateVersion
        JOIN FETCH i.technician
        JOIN FETCH i.supervisor
        LEFT JOIN FETCH i.reviewedBy
        WHERE i.technician.id = :technicianId
          AND (
                i.updatedAt > :cursorUpdatedAt
                OR (i.updatedAt = :cursorUpdatedAt AND i.id > :cursorId)
              )
        ORDER BY i.updatedAt ASC, i.id ASC
    """)
    List<Inspection> findChangesForTechnicianAfter(
            @Param("technicianId") Long technicianId,
            @Param("cursorUpdatedAt") Instant cursorUpdatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable);

    @Query("""
        SELECT i.status, COUNT(i)
        FROM Inspection i
        WHERE (CAST(:from AS date) IS NULL OR i.dueDate >= :from)
          AND (CAST(:to AS date) IS NULL OR i.dueDate <= :to)
          AND (CAST(:clientName AS string) IS NULL OR LOWER(i.clientName) = :clientName)
          AND (CAST(:technicianId AS long) IS NULL OR i.technician.id = :technicianId)
        GROUP BY i.status
    """)
    List<Object[]> countByStatus(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("clientName") String clientName,
            @Param("technicianId") Long technicianId);

    @Query("""
        SELECT i.priority, COUNT(i)
        FROM Inspection i
        WHERE i.status NOT IN :terminalStatuses
          AND (CAST(:from AS date) IS NULL OR i.dueDate >= :from)
          AND (CAST(:to AS date) IS NULL OR i.dueDate <= :to)
          AND (CAST(:clientName AS string) IS NULL OR LOWER(i.clientName) = :clientName)
          AND (CAST(:technicianId AS long) IS NULL OR i.technician.id = :technicianId)
        GROUP BY i.priority
    """)
    List<Object[]> countByPriority(
            @Param("terminalStatuses") List<InspectionStatus> terminalStatuses,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("clientName") String clientName,
            @Param("technicianId") Long technicianId);

    @Query("""
        SELECT COUNT(i)
        FROM Inspection i
        WHERE i.dueDate < :today
          AND i.status NOT IN :terminalStatuses
          AND (CAST(:from AS date) IS NULL OR i.dueDate >= :from)
          AND (CAST(:to AS date) IS NULL OR i.dueDate <= :to)
          AND (CAST(:clientName AS string) IS NULL OR LOWER(i.clientName) = :clientName)
          AND (CAST(:technicianId AS long) IS NULL OR i.technician.id = :technicianId)
    """)
    long countOverdue(
            @Param("today") LocalDate today,
            @Param("terminalStatuses") List<InspectionStatus> terminalStatuses,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("clientName") String clientName,
            @Param("technicianId") Long technicianId);
}
