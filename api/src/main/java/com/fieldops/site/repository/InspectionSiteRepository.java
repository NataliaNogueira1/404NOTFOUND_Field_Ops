package com.fieldops.site.repository;

import com.fieldops.site.model.InspectionSite;
import com.fieldops.site.model.SiteStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InspectionSiteRepository extends JpaRepository<InspectionSite, Long>,
        JpaSpecificationExecutor<InspectionSite> {

    long countByClientIdAndStatus(Long clientId, SiteStatus status);

    Page<InspectionSite> findByClientIdAndStatus(Long clientId, SiteStatus status, Pageable pageable);

    @Query("SELECT s FROM InspectionSite s WHERE s.client.id = :clientId AND s.status = :status " +
            "AND LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<InspectionSite> findByClientIdAndStatusAndSearch(
            @Param("clientId") Long clientId,
            @Param("status") SiteStatus status,
            @Param("search") String search,
            Pageable pageable);

    Page<InspectionSite> findByStatus(SiteStatus status, Pageable pageable);

    @Query("SELECT s FROM InspectionSite s WHERE s.status = :status " +
            "AND LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<InspectionSite> findByStatusAndSearch(
            @Param("status") SiteStatus status,
            @Param("search") String search,
            Pageable pageable);
}
