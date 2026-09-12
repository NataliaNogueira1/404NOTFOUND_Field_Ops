package com.fieldops.inspection.repository;

import com.fieldops.inspection.model.InspectionTemplate;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InspectionTemplateRepository extends JpaRepository<InspectionTemplate, Long>,
        JpaSpecificationExecutor<InspectionTemplate> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT template FROM InspectionTemplate template WHERE template.id = :id")
    Optional<InspectionTemplate> findByIdForUpdate(@Param("id") Long id);
}
