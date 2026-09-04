package com.fieldops.equipment.repository;

import com.fieldops.equipment.model.Equipment;
import com.fieldops.equipment.model.EquipmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    Page<Equipment> findBySiteIdAndStatus(Long siteId, EquipmentStatus status, Pageable pageable);

    @Query("SELECT e FROM Equipment e WHERE e.site.id = :siteId AND e.status = :status " +
           "AND (LOWER(e.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(e.assetNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(e.serialNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Equipment> findBySiteIdAndStatusAndSearch(
            @Param("siteId") Long siteId,
            @Param("status") EquipmentStatus status,
            @Param("search") String search,
            Pageable pageable);

    Optional<Equipment> findByQrCode(String qrCode);

    boolean existsByQrCode(String qrCode);
}
