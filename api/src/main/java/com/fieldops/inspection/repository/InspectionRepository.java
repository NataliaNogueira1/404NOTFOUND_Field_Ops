package com.fieldops.inspection.repository;

import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("""
        SELECT i.status, COUNT(i)
        FROM Inspection i
        WHERE (:from IS NULL OR i.dueDate >= :from)
          AND (:to IS NULL OR i.dueDate <= :to)
          AND (:clientName IS NULL OR LOWER(i.clientName) = LOWER(:clientName))
          AND (:technicianId IS NULL OR i.technician.id = :technicianId)
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
          AND (:from IS NULL OR i.dueDate >= :from)
          AND (:to IS NULL OR i.dueDate <= :to)
          AND (:clientName IS NULL OR LOWER(i.clientName) = LOWER(:clientName))
          AND (:technicianId IS NULL OR i.technician.id = :technicianId)
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
          AND (:from IS NULL OR i.dueDate >= :from)
          AND (:to IS NULL OR i.dueDate <= :to)
          AND (:clientName IS NULL OR LOWER(i.clientName) = LOWER(:clientName))
          AND (:technicianId IS NULL OR i.technician.id = :technicianId)
    """)
    long countOverdue(
            @Param("today") LocalDate today,
            @Param("terminalStatuses") List<InspectionStatus> terminalStatuses,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("clientName") String clientName,
            @Param("technicianId") Long technicianId);
}
