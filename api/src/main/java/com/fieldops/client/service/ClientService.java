package com.fieldops.client.service;

import com.fieldops.client.dto.ClientResponse;
import com.fieldops.client.dto.CreateClientRequest;
import com.fieldops.client.dto.UpdateClientRequest;
import com.fieldops.client.model.Client;
import com.fieldops.client.model.ClientStatus;
import com.fieldops.client.repository.ClientRepository;
import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business logic for the Client domain.
 */
@Service
public class ClientService {

    private final ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    @Transactional(readOnly = true)
    public Page<ClientResponse> list(ClientStatus status, String search, Pageable pageable) {
        Page<Client> page;
        if (search != null && !search.isBlank()) {
            page = clientRepository.findByStatusAndSearch(
                    status != null ? status : ClientStatus.ACTIVE, search.trim(), pageable);
        } else {
            page = clientRepository.findByStatus(
                    status != null ? status : ClientStatus.ACTIVE, pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ClientResponse findById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + id));
        return toResponse(client);
    }

    @Transactional
    public ClientResponse create(CreateClientRequest request) {
        if (request.document() != null && !request.document().isBlank()) {
            if (clientRepository.existsByDocument(request.document())) {
                throw new BusinessException("A client with this document already exists");
            }
        }

        Client client = new Client();
        client.setName(request.name());
        client.setLegalName(request.legalName());
        client.setDocument(request.document());
        client.setEmail(request.email());
        client.setPhone(request.phone());

        client = clientRepository.save(client);
        return toResponse(client);
    }

    @Transactional
    public ClientResponse update(Long id, UpdateClientRequest request) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + id));

        // Check document uniqueness if changed
        if (request.document() != null && !request.document().isBlank()) {
            clientRepository.findByDocument(request.document())
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new BusinessException("A client with this document already exists");
                    });
        }

        client.setName(request.name());
        client.setLegalName(request.legalName());
        client.setDocument(request.document());
        client.setEmail(request.email());
        client.setPhone(request.phone());

        client = clientRepository.save(client);
        return toResponse(client);
    }

    @Transactional
    public void deactivate(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + id));

        if (client.getStatus() == ClientStatus.INACTIVE) {
            throw new BusinessException("Client is already inactive");
        }

        client.setStatus(ClientStatus.INACTIVE);
        clientRepository.save(client);
    }

    @Transactional
    public void activate(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + id));

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
                client.getCreatedAt(),
                client.getUpdatedAt(),
                client.getVersion()
        );
    }
}
