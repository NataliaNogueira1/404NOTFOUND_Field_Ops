package com.fieldops.site.service;

import com.fieldops.client.model.Client;
import com.fieldops.client.model.ClientStatus;
import com.fieldops.client.repository.ClientRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.site.dto.CreateSiteRequest;
import com.fieldops.site.dto.SiteResponse;
import com.fieldops.site.dto.UpdateSiteRequest;
import com.fieldops.site.model.InspectionSite;
import com.fieldops.site.model.SiteStatus;
import com.fieldops.site.repository.InspectionSiteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business logic for the InspectionSite domain.
 */
@Service
public class InspectionSiteService {

    private final InspectionSiteRepository siteRepository;
    private final ClientRepository clientRepository;

    public InspectionSiteService(InspectionSiteRepository siteRepository,
                                  ClientRepository clientRepository) {
        this.siteRepository = siteRepository;
        this.clientRepository = clientRepository;
    }

    @Transactional(readOnly = true)
    public Page<SiteResponse> listByClient(Long clientId, SiteStatus status, String search, Pageable pageable) {
        SiteStatus effectiveStatus = status != null ? status : SiteStatus.ACTIVE;
        Page<InspectionSite> page;

        if (search != null && !search.isBlank()) {
            page = siteRepository.findByClientIdAndStatusAndSearch(clientId, effectiveStatus, search.trim(), pageable);
        } else {
            page = siteRepository.findByClientIdAndStatus(clientId, effectiveStatus, pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public SiteResponse findById(Long id) {
        InspectionSite site = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection site not found: " + id));
        return toResponse(site);
    }

    @Transactional
    public SiteResponse create(CreateSiteRequest request) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + request.clientId()));

        if (client.getStatus() == ClientStatus.INACTIVE) {
            throw new BusinessException("Cannot add site to inactive client");
        }

        InspectionSite site = new InspectionSite();
        site.setClient(client);
        site.setName(request.name());
        site.setDescription(request.description());
        site.setAddressLine(request.addressLine());
        site.setCity(request.city());
        site.setState(request.state());
        site.setPostalCode(request.postalCode());
        site.setLatitude(request.latitude());
        site.setLongitude(request.longitude());
        site.setContactName(request.contactName());
        site.setContactPhone(request.contactPhone());

        site = siteRepository.save(site);
        return toResponse(site);
    }

    @Transactional
    public SiteResponse update(Long id, UpdateSiteRequest request) {
        InspectionSite site = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection site not found: " + id));

        site.setName(request.name());
        site.setDescription(request.description());
        site.setAddressLine(request.addressLine());
        site.setCity(request.city());
        site.setState(request.state());
        site.setPostalCode(request.postalCode());
        site.setLatitude(request.latitude());
        site.setLongitude(request.longitude());
        site.setContactName(request.contactName());
        site.setContactPhone(request.contactPhone());

        site = siteRepository.save(site);
        return toResponse(site);
    }

    @Transactional
    public void deactivate(Long id) {
        InspectionSite site = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection site not found: " + id));

        if (site.getStatus() == SiteStatus.INACTIVE) {
            throw new BusinessException("Site is already inactive");
        }
        site.setStatus(SiteStatus.INACTIVE);
        siteRepository.save(site);
    }

    @Transactional
    public void activate(Long id) {
        InspectionSite site = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection site not found: " + id));

        if (site.getStatus() == SiteStatus.ACTIVE) {
            throw new BusinessException("Site is already active");
        }
        site.setStatus(SiteStatus.ACTIVE);
        siteRepository.save(site);
    }

    private SiteResponse toResponse(InspectionSite site) {
        return new SiteResponse(
                site.getId(),
                site.getClient().getId(),
                site.getClient().getName(),
                site.getName(),
                site.getDescription(),
                site.getAddressLine(),
                site.getCity(),
                site.getState(),
                site.getPostalCode(),
                site.getLatitude(),
                site.getLongitude(),
                site.getContactName(),
                site.getContactPhone(),
                site.getStatus(),
                site.getCreatedAt(),
                site.getUpdatedAt(),
                site.getVersion()
        );
    }
}
