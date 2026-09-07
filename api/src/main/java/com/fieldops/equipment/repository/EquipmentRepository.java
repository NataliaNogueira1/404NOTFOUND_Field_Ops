package com.fieldops.equipment.repository;

import com.fieldops.equipment.model.Equipment;
import com.fieldops.equipment.model.EquipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
public interface EquipmentRepository extends JpaRepository<Equipment, Long>, JpaSpecificationExecutor<Equipment> {

    Optional<Equipment> findByQrCode(String qrCode);

    boolean existsByQrCode(String qrCode);

    boolean existsByQrCodeAndIdNot(String qrCode, Long id);

    long countBySiteIdAndStatus(Long siteId, EquipmentStatus status);
}
