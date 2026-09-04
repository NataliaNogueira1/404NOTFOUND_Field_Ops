package com.fieldops.equipment.service;

import com.fieldops.equipment.dto.EquipmentRequest;
import com.fieldops.equipment.dto.EquipmentResponse;
import com.fieldops.equipment.model.Equipment;
import com.fieldops.equipment.model.EquipmentStatus;
import com.fieldops.equipment.repository.EquipmentRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceConflictException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.site.model.InspectionSite;
import com.fieldops.site.model.SiteStatus;
import com.fieldops.site.repository.InspectionSiteRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final InspectionSiteRepository siteRepository;

    public EquipmentService(EquipmentRepository equipmentRepository, InspectionSiteRepository siteRepository) {
        this.equipmentRepository = equipmentRepository;
        this.siteRepository = siteRepository;
    }

    /** Finds equipment using site and lifecycle filters with server-side pagination. */
    @Transactional(readOnly = true)
    public Page<EquipmentResponse> list(Long siteId, EquipmentStatus status, Pageable pageable) {
        return equipmentRepository.findAll(buildFilters(siteId, status), pageable).map(this::toResponse);
    }

    /** Lists every equipment record attached to one inspection site. */
    @Transactional(readOnly = true)
    public List<EquipmentResponse> listBySite(Long siteId) {
        requireSite(siteId);
        return equipmentRepository.findAll(buildFilters(siteId, null), Sort.by("name"))
                .stream().map(this::toResponse).toList();
    }

    /** Returns one equipment record by its persistent identifier. */
    @Transactional(readOnly = true)
    public EquipmentResponse get(Long id) {
        return toResponse(getRequired(id));
    }

    /** Resolves the exact unique code submitted by a QR scanner. */
    @Transactional(readOnly = true)
    public EquipmentResponse getByQrCode(String qrCode) {
        String normalized = normalizeQrCode(qrCode);
        return equipmentRepository.findByQrCode(normalized).map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment QR code not found: " + normalized));
    }

    /** Creates equipment attached to an active site and enforces QR uniqueness. */
    @Transactional
    public EquipmentResponse create(EquipmentRequest request) {
        String qrCode = normalizeQrCode(request.qrCode());
        ensureUniqueQrCode(qrCode, null);
        Equipment equipment = new Equipment();
        apply(equipment, request, qrCode);
        return save(equipment, qrCode);
    }

    /** Updates all editable equipment fields while retaining the database identity. */
    @Transactional
    public EquipmentResponse update(Long id, EquipmentRequest request) {
        Equipment equipment = getRequired(id);
        String qrCode = normalizeQrCode(request.qrCode());
        ensureUniqueQrCode(qrCode, id);
        apply(equipment, request, qrCode);
        return save(equipment, qrCode);
    }

    /** Changes equipment availability without deleting inspection history. */
    @Transactional
    public EquipmentResponse updateStatus(Long id, EquipmentStatus status) {
        Equipment equipment = getRequired(id);
        equipment.setStatus(status);
        return toResponse(equipmentRepository.saveAndFlush(equipment));
    }

    private Specification<Equipment> buildFilters(Long siteId, EquipmentStatus status) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (siteId != null) predicates.add(builder.equal(root.get("site").get("id"), siteId));
            if (status != null) predicates.add(builder.equal(root.get("status"), status));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void apply(Equipment equipment, EquipmentRequest request, String qrCode) {
        equipment.setSite(requireActiveSite(request.siteId()));
        equipment.setName(request.name().trim());
        equipment.setAssetNumber(optional(request.assetNumber()));
        equipment.setSerialNumber(optional(request.serialNumber()));
        equipment.setManufacturer(optional(request.manufacturer()));
        equipment.setModel(optional(request.model()));
        equipment.setDescription(optional(request.description()));
        equipment.setQrCode(qrCode);
        equipment.setStatus(request.status());
        equipment.setInstalledAt(request.installedAt());
    }

    private InspectionSite requireActiveSite(Long siteId) {
        InspectionSite site = requireSite(siteId);
        if (site.getStatus() != SiteStatus.ACTIVE) {
            throw new BusinessException("Inspection site must be active: " + siteId);
        }
        return site;
    }

    private InspectionSite requireSite(Long siteId) {
        return siteRepository.findById(siteId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection site not found: " + siteId));
    }

    private Equipment getRequired(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found: " + id));
    }

    private void ensureUniqueQrCode(String qrCode, Long currentId) {
        boolean duplicate = currentId == null
                ? equipmentRepository.existsByQrCode(qrCode)
                : equipmentRepository.existsByQrCodeAndIdNot(qrCode, currentId);
        if (duplicate) throw duplicateQrCode(qrCode);
    }

    private EquipmentResponse save(Equipment equipment, String qrCode) {
        try {
            return toResponse(equipmentRepository.saveAndFlush(equipment));
        } catch (DataIntegrityViolationException exception) {
            throw duplicateQrCode(qrCode);
        }
    }

    private ResourceConflictException duplicateQrCode(String qrCode) {
        return new ResourceConflictException("Equipment QR code already exists: " + qrCode);
    }

    private String normalizeQrCode(String qrCode) {
        return qrCode.trim();
    }

    private String optional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private EquipmentResponse toResponse(Equipment equipment) {
        InspectionSite site = equipment.getSite();
        return new EquipmentResponse(equipment.getId(), site.getId(), site.getName(), site.getClient().getId(),
                equipment.getName(), equipment.getAssetNumber(), equipment.getSerialNumber(),
                equipment.getManufacturer(), equipment.getModel(), equipment.getDescription(),
                equipment.getQrCode(), equipment.getStatus(), equipment.getInstalledAt(),
                equipment.getCreatedAt(), equipment.getUpdatedAt(), equipment.getVersion());
    }
}
