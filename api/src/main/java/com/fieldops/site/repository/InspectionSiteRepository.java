package com.fieldops.site.repository;

import com.fieldops.site.model.InspectionSite;
import com.fieldops.site.model.SiteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface InspectionSiteRepository extends JpaRepository<InspectionSite, Long>,
        JpaSpecificationExecutor<InspectionSite> {

    long countByClientIdAndStatus(Long clientId, SiteStatus status);
}
