package com.fieldops.site.service;

import com.fieldops.client.model.Client;
import com.fieldops.client.model.ClientStatus;
import com.fieldops.client.repository.ClientRepository;
import com.fieldops.equipment.repository.EquipmentRepository;
import com.fieldops.equipment.model.EquipmentStatus;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.site.dto.CreateSiteRequest;
import com.fieldops.site.dto.InspectionSiteRequest;
import com.fieldops.site.dto.InspectionSiteResponse;
import com.fieldops.site.dto.SiteResponse;
import com.fieldops.site.dto.UpdateSiteRequest;
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

    /** Keeps the original paginated site contract available for internal callers. */
    @Transactional(readOnly = true)
    public Page<SiteResponse> list(Long clientId, SiteStatus status, String search, Pageable pageable) {
        SiteStatus effectiveStatus = status != null ? status : SiteStatus.ACTIVE;
        boolean hasSearch = search != null && !search.isBlank();
        String term = hasSearch ? search.trim() : null;

        Page<InspectionSite> page;
        if (clientId != null) {
            page = hasSearch
                    ? siteRepository.findByClientIdAndStatusAndSearch(clientId, effectiveStatus, term, pageable)
                    : siteRepository.findByClientIdAndStatus(clientId, effectiveStatus, pageable);
        } else {
            page = hasSearch
                    ? siteRepository.findByStatusAndSearch(effectiveStatus, term, pageable)
                    : siteRepository.findByStatus(effectiveStatus, pageable);
        }
        return page.map(this::toLegacyResponse);
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

    @Transactional(readOnly = true)
    public SiteResponse findById(Long id) {
        return toLegacyResponse(getRequired(id));
    }

    /** Creates an active site attached to an active client. */
    @Transactional
    public InspectionSiteResponse create(InspectionSiteRequest request) {
        InspectionSite site = new InspectionSite();
        apply(site, request);
        return toResponse(siteRepository.saveAndFlush(site));
    }

    @Transactional
    public SiteResponse create(CreateSiteRequest request) {
        Client client = requireClient(request.clientId());
        if (client.getStatus() != ClientStatus.ACTIVE) {
            throw new BusinessException("Cannot add site to inactive client");
        }
        InspectionSite site = new InspectionSite();
        site.setClient(client);
        applyLegacyFields(site, request.name(), request.description(), request.addressLine(), request.city(),
                request.state(), request.postalCode(), request.latitude(), request.longitude(),
                request.contactName(), request.contactPhone());
        return toLegacyResponse(siteRepository.save(site));
    }

    /** Updates site data and its client association without changing lifecycle status. */
    @Transactional
    public InspectionSiteResponse update(Long id, InspectionSiteRequest request) {
        InspectionSite site = getRequired(id);
        apply(site, request);
        return toResponse(siteRepository.saveAndFlush(site));
    }

    @Transactional
    public SiteResponse update(Long id, UpdateSiteRequest request) {
        InspectionSite site = getRequired(id);
        applyLegacyFields(site, request.name(), request.description(), request.addressLine(), request.city(),
                request.state(), request.postalCode(), request.latitude(), request.longitude(),
                request.contactName(), request.contactPhone());
        return toLegacyResponse(siteRepository.save(site));
    }

    /** Changes site availability while retaining the record and its history. */
    @Transactional
    public InspectionSiteResponse updateStatus(Long id, SiteStatus status) {
        InspectionSite site = getRequired(id);
        site.setStatus(status);
        return toResponse(siteRepository.saveAndFlush(site));
    }

    @Transactional
    public void deactivate(Long id) {
        changeStatus(id, SiteStatus.INACTIVE);
    }

    @Transactional
    public void activate(Long id) {
        changeStatus(id, SiteStatus.ACTIVE);
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

    private void applyLegacyFields(InspectionSite site, String name, String description, String addressLine,
            String city, String state, String postalCode, java.math.BigDecimal latitude,
            java.math.BigDecimal longitude, String contactName, String contactPhone) {
        site.setName(name);
        site.setDescription(description);
        site.setAddressLine(addressLine);
        site.setCity(city);
        site.setState(state);
        site.setPostalCode(postalCode);
        site.setLatitude(latitude);
        site.setLongitude(longitude);
        site.setContactName(contactName);
        site.setContactPhone(contactPhone);
    }

    private void changeStatus(Long id, SiteStatus targetStatus) {
        InspectionSite site = getRequired(id);
        if (site.getStatus() == targetStatus) {
            throw new BusinessException("Site is already " + targetStatus.name().toLowerCase(Locale.ROOT));
        }
        site.setStatus(targetStatus);
        siteRepository.save(site);
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

    private SiteResponse toLegacyResponse(InspectionSite site) {
        Client client = site.getClient();
        return new SiteResponse(site.getId(), client.getId(), client.getName(), site.getName(),
                site.getDescription(), site.getAddressLine(), site.getCity(), site.getState(), site.getPostalCode(),
                site.getLatitude(), site.getLongitude(), site.getContactName(), site.getContactPhone(),
                site.getStatus(), site.getCreatedAt(), site.getUpdatedAt(), site.getVersion());
    }
}
