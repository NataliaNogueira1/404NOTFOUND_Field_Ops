package com.fieldops.site.service;

import com.fieldops.client.model.Client;
import com.fieldops.client.model.ClientStatus;
import com.fieldops.client.repository.ClientRepository;
import com.fieldops.equipment.repository.EquipmentRepository;
import com.fieldops.equipment.model.EquipmentStatus;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.site.dto.InspectionSiteRequest;
import com.fieldops.site.dto.InspectionSiteResponse;
import com.fieldops.site.model.InspectionSite;
import com.fieldops.site.model.SiteStatus;
import com.fieldops.site.repository.InspectionSiteRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class InspectionSiteService {

    private final InspectionSiteRepository siteRepository;
    private final ClientRepository clientRepository;
    private final EquipmentRepository equipmentRepository;

    public InspectionSiteService(InspectionSiteRepository siteRepository, ClientRepository clientRepository,
            EquipmentRepository equipmentRepository) {
        this.siteRepository = siteRepository;
        this.clientRepository = clientRepository;
        this.equipmentRepository = equipmentRepository;
    }

    /** Finds sites using server-side name, client, and lifecycle filters. */
    @Transactional(readOnly = true)
    public Page<InspectionSiteResponse> list(String name, Long clientId, SiteStatus status,
                                             Pageable pageable) {
        return siteRepository.findAll(buildFilters(name, clientId, status), pageable).map(this::toResponse);
    }

    /** Lists every site belonging to one client for the client structure view. */
    @Transactional(readOnly = true)
    public List<InspectionSiteResponse> listByClient(Long clientId) {
        requireClient(clientId);
        return siteRepository.findAll(buildFilters(null, clientId, null), Sort.by("name"))
                .stream().map(this::toResponse).toList();
    }

    /** Returns one site together with its parent client identity. */
    @Transactional(readOnly = true)
    public InspectionSiteResponse get(Long id) {
        return toResponse(getRequired(id));
    }

    /** Creates an active site attached to an active client. */
    @Transactional
    public InspectionSiteResponse create(InspectionSiteRequest request) {
        InspectionSite site = new InspectionSite();
        apply(site, request);
        return toResponse(siteRepository.saveAndFlush(site));
    }

    /** Updates site data and its client association without changing lifecycle status. */
    @Transactional
    public InspectionSiteResponse update(Long id, InspectionSiteRequest request) {
        InspectionSite site = getRequired(id);
        apply(site, request);
        return toResponse(siteRepository.saveAndFlush(site));
    }

    /** Changes site availability while retaining the record and its history. */
    @Transactional
    public InspectionSiteResponse updateStatus(Long id, SiteStatus status) {
        InspectionSite site = getRequired(id);
        site.setStatus(status);
        return toResponse(siteRepository.saveAndFlush(site));
    }

    private Specification<InspectionSite> buildFilters(String name, Long clientId, SiteStatus status) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (name != null && !name.isBlank()) {
                String pattern = "%" + name.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.like(builder.lower(root.get("name")), pattern));
            }
            if (clientId != null) predicates.add(builder.equal(root.get("client").get("id"), clientId));
            if (status != null) predicates.add(builder.equal(root.get("status"), status));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void apply(InspectionSite site, InspectionSiteRequest request) {
        site.setClient(requireActiveClient(request.clientId()));
        site.setName(request.name().trim());
        site.setDescription(optional(request.description()));
        site.setAddressLine(optional(request.address()));
        site.setCity(optional(request.city()));
        site.setState(optional(request.state()));
        site.setPostalCode(optional(request.zipCode()));
        site.setLatitude(request.latitude());
        site.setLongitude(request.longitude());
        site.setContactName(optional(request.contactName()));
        site.setContactPhone(optional(request.contactPhone()));
    }

    private Client requireActiveClient(Long clientId) {
        Client client = requireClient(clientId);
        if (client.getStatus() != ClientStatus.ACTIVE) {
            throw new BusinessException("Client must be active: " + clientId);
        }
        return client;
    }

    private Client requireClient(Long clientId) {
        return clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + clientId));
    }

    private InspectionSite getRequired(Long id) {
        return siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection site not found: " + id));
    }

    private String optional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private InspectionSiteResponse toResponse(InspectionSite site) {
        Client client = site.getClient();
        return new InspectionSiteResponse(site.getId(), client.getId(), client.getName(), site.getName(),
                site.getDescription(), site.getAddressLine(), site.getCity(), site.getState(), site.getPostalCode(),
                site.getLatitude(), site.getLongitude(), site.getContactName(), site.getContactPhone(),
                site.getStatus(), equipmentRepository.countBySiteIdAndStatus(site.getId(), EquipmentStatus.ACTIVE),
                site.getCreatedAt(), site.getUpdatedAt(), site.getVersion());
    }
}
