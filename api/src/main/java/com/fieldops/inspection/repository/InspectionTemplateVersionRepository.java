package com.fieldops.inspection.repository;

import com.fieldops.inspection.model.InspectionTemplateVersion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InspectionTemplateVersionRepository extends JpaRepository<InspectionTemplateVersion, Long> {

    List<InspectionTemplateVersion> findByTemplateIdOrderByVersionNumberAsc(Long templateId);

    @Query("SELECT COALESCE(MAX(version.versionNumber), 0) FROM InspectionTemplateVersion version "
            + "WHERE version.template.id = :templateId")
    Integer findMaximumVersionNumber(@Param("templateId") Long templateId);
}
