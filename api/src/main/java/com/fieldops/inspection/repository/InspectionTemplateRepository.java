package com.fieldops.inspection.repository;

import com.fieldops.inspection.model.InspectionTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InspectionTemplateRepository extends JpaRepository<InspectionTemplate, Long>,
        JpaSpecificationExecutor<InspectionTemplate> {
}
