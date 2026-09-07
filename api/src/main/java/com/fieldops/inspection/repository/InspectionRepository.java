package com.fieldops.inspection.repository;

import com.fieldops.inspection.model.Inspection;
import com.fieldops.inspection.model.InspectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
