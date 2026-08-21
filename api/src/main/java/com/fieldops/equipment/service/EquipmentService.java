package com.fieldops.equipment.service;

import com.fieldops.equipment.dto.CreateEquipmentRequest;
import com.fieldops.equipment.dto.EquipmentResponse;
import com.fieldops.equipment.dto.UpdateEquipmentRequest;
import com.fieldops.equipment.model.Equipment;
import com.fieldops.equipment.model.EquipmentStatus;
import com.fieldops.equipment.repository.EquipmentRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.site.model.InspectionSite;
import com.fieldops.site.model.SiteStatus;
import com.fieldops.site.repository.InspectionSiteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business logic for the Equipment domain.
 */
@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final InspectionSiteRepository siteRepository;

    public EquipmentService(EquipmentRepository equipmentRepository,
                            InspectionSiteRepository siteRepository) {
        this.equipmentRepository = equipmentRepository;
        this.siteRepository = siteRepository;
    }

    @Transactional(readOnly = true)
    public Page<EquipmentResponse> listBySite(Long siteId, EquipmentStatus status, String search, Pageable pageable) {
        EquipmentStatus effectiveStatus = status != null ? status : EquipmentStatus.ACTIVE;
        Page<Equipment> page;

        if (search != null && !search.isBlank()) {
            page = equipmentRepository.findBySiteIdAndStatusAndSearch(siteId, effectiveStatus, search.trim(), pageable);
        } else {
            page = equipmentRepository.findBySiteIdAndStatus(siteId, effectiveStatus, pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public EquipmentResponse findById(Long id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found: " + id));
        return toResponse(equipment);
    }

    @Transactional(readOnly = true)
    public EquipmentResponse findByQrCode(String qrCode) {
        Equipment equipment = equipmentRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with QR code: " + qrCode));
        return toResponse(equipment);
    }

    @Transactional
    public EquipmentResponse create(CreateEquipmentRequest request) {
        InspectionSite site = siteRepository.findById(request.siteId())
                .orElseThrow(() -> new ResourceNotFoundException("Site not found: " + request.siteId()));

        if (site.getStatus() == SiteStatus.INACTIVE) {
            throw new BusinessException("Cannot add equipment to inactive site");
        }

        if (request.qrCode() != null && !request.qrCode().isBlank()) {
            if (equipmentRepository.existsByQrCode(request.qrCode())) {
                throw new BusinessException("QR code already in use by another equipment");
            }
        }

        Equipment equipment = new Equipment();
        equipment.setSite(site);
        equipment.setName(request.name());
        equipment.setAssetNumber(request.assetNumber());
        equipment.setSerialNumber(request.serialNumber());
        equipment.setManufacturer(request.manufacturer());
        equipment.setModel(request.model());
        equipment.setDescription(request.description());
        equipment.setQrCode(request.qrCode());
        equipment.setInstalledAt(request.installedAt());

        equipment = equipmentRepository.save(equipment);
        return toResponse(equipment);
    }

    @Transactional
    public EquipmentResponse update(Long id, UpdateEquipmentRequest request) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found: " + id));

        // Check QR code uniqueness if changed
        if (request.qrCode() != null && !request.qrCode().isBlank()) {
            equipmentRepository.findByQrCode(request.qrCode())
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new BusinessException("QR code already in use by another equipment");
                    });
        }

        equipment.setName(request.name());
        equipment.setAssetNumber(request.assetNumber());
        equipment.setSerialNumber(request.serialNumber());
        equipment.setManufacturer(request.manufacturer());
        equipment.setModel(request.model());
        equipment.setDescription(request.description());
        equipment.setQrCode(request.qrCode());
        equipment.setInstalledAt(request.installedAt());

        equipment = equipmentRepository.save(equipment);
        return toResponse(equipment);
    }

    @Transactional
    public void deactivate(Long id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found: " + id));

        if (equipment.getStatus() != EquipmentStatus.ACTIVE) {
            throw new BusinessException("Equipment is not active");
        }
        equipment.setStatus(EquipmentStatus.INACTIVE);
        equipmentRepository.save(equipment);
    }

    @Transactional
    public void decommission(Long id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found: " + id));

        equipment.setStatus(EquipmentStatus.DECOMMISSIONED);
        equipmentRepository.save(equipment);
    }

    @Transactional
    public void activate(Long id) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found: " + id));

        if (equipment.getStatus() == EquipmentStatus.ACTIVE) {
            throw new BusinessException("Equipment is already active");
        }
        if (equipment.getStatus() == EquipmentStatus.DECOMMISSIONED) {
            throw new BusinessException("Cannot reactivate decommissioned equipment");
        }
        equipment.setStatus(EquipmentStatus.ACTIVE);
        equipmentRepository.save(equipment);
    }

    private EquipmentResponse toResponse(Equipment equipment) {
        InspectionSite site = equipment.getSite();
        return new EquipmentResponse(
                equipment.getId(),
                site.getId(),
                site.getName(),
                site.getClient().getId(),
                site.getClient().getName(),
                equipment.getName(),
                equipment.getAssetNumber(),
                equipment.getSerialNumber(),
                equipment.getManufacturer(),
                equipment.getModel(),
                equipment.getDescription(),
                equipment.getQrCode(),
                equipment.getStatus(),
                equipment.getInstalledAt(),
                equipment.getCreatedAt(),
                equipment.getUpdatedAt(),
                equipment.getVersion()
        );
    }
}
