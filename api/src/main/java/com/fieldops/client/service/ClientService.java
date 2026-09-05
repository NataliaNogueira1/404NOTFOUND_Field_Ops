package com.fieldops.client.service;

import com.fieldops.client.dto.ClientRequest;
import com.fieldops.client.dto.ClientResponse;
import com.fieldops.client.model.Client;
import com.fieldops.client.model.ClientStatus;
import com.fieldops.client.repository.ClientRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.site.model.SiteStatus;
import com.fieldops.site.repository.InspectionSiteRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Business logic for the Client domain.
 */
@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final InspectionSiteRepository siteRepository;

    public ClientService(ClientRepository clientRepository, InspectionSiteRepository siteRepository) {
        this.clientRepository = clientRepository;
        this.siteRepository = siteRepository;
    }

    @Transactional(readOnly = true)
    public Page<ClientResponse> list(String name, ClientStatus status, Pageable pageable) {
        return clientRepository.findAll(buildFilters(name, status), pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ClientResponse get(Long id) {
        return toResponse(getRequired(id));
    }

    @Transactional
    public ClientResponse create(ClientRequest request) {
        ensureDocumentAvailable(request.document(), null);
        Client client = new Client();
        apply(client, request);
        return toResponse(clientRepository.saveAndFlush(client));
    }

    @Transactional
    public ClientResponse update(Long id, ClientRequest request) {
        Client client = getRequired(id);
        ensureDocumentAvailable(request.document(), id);
        apply(client, request);
        return toResponse(clientRepository.saveAndFlush(client));
    }

    @Transactional
    public ClientResponse updateStatus(Long id, ClientStatus status) {
        Client client = getRequired(id);
        client.setStatus(status);
        return toResponse(clientRepository.saveAndFlush(client));
    }

    @Transactional
    public void deactivate(Long id) {
        Client client = getRequired(id);

        if (client.getStatus() == ClientStatus.INACTIVE) {
            throw new BusinessException("Client is already inactive");
        }

        client.setStatus(ClientStatus.INACTIVE);
        clientRepository.save(client);
    }

    @Transactional
    public void activate(Long id) {
        Client client = getRequired(id);

        if (client.getStatus() == ClientStatus.ACTIVE) {
            throw new BusinessException("Client is already active");
        }

        client.setStatus(ClientStatus.ACTIVE);
        clientRepository.save(client);
    }

    private ClientResponse toResponse(Client client) {
        return new ClientResponse(
                client.getId(),
                client.getName(),
                client.getLegalName(),
                client.getDocument(),
                client.getEmail(),
                client.getPhone(),
                client.getStatus(),
                siteRepository.countByClientIdAndStatus(client.getId(), SiteStatus.ACTIVE),
                client.getCreatedAt(),
                client.getUpdatedAt(),
                client.getVersion()
        );
    }

    private Specification<Client> buildFilters(String name, ClientStatus status) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (name != null && !name.isBlank()) {
                String pattern = "%" + name.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.like(builder.lower(root.get("name")), pattern));
            }
            if (status != null) predicates.add(builder.equal(root.get("status"), status));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Client getRequired(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + id));
    }

    private void ensureDocumentAvailable(String document, Long currentId) {
        if (document == null || document.isBlank()) return;
        clientRepository.findByDocument(document.trim())
                .filter(existing -> !existing.getId().equals(currentId))
                .ifPresent(existing -> {
                    throw new BusinessException("A client with this document already exists");
                });
    }

    private void apply(Client client, ClientRequest request) {
        client.setName(request.name().trim());
        client.setLegalName(optional(request.legalName()));
        client.setDocument(optional(request.document()));
        client.setEmail(optional(request.email()));
        client.setPhone(optional(request.phone()));
    }

    private String optional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
