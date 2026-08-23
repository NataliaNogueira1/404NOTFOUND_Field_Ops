package com.fieldops.inspection.repository;

import com.fieldops.inspection.model.InspectionTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InspectionTemplateRepository extends JpaRepository<InspectionTemplate, Long> {
}
