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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InspectionSiteServiceTest {

    @Mock
    private InspectionSiteRepository siteRepository;

    @Mock
    private ClientRepository clientRepository;

    private InspectionSiteService siteService;

    @BeforeEach
    void setUp() {
        siteService = new InspectionSiteService(siteRepository, clientRepository);
    }

    @Test
    void listScopedByClientUsesClientQueryWhenNoSearch() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<InspectionSite> page = new PageImpl<>(List.of(buildSite(activeClient())));
        when(siteRepository.findByClientIdAndStatus(1L, SiteStatus.ACTIVE, pageable)).thenReturn(page);

        Page<SiteResponse> result = siteService.list(1L, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(siteRepository).findByClientIdAndStatus(1L, SiteStatus.ACTIVE, pageable);
        verify(siteRepository, never()).findByStatus(any(), any());
    }

    @Test
    void listScopedByClientUsesSearchQueryWhenSearchProvided() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<InspectionSite> page = new PageImpl<>(List.of(buildSite(activeClient())));
        when(siteRepository.findByClientIdAndStatusAndSearch(1L, SiteStatus.ACTIVE, "unit", pageable))
                .thenReturn(page);

        Page<SiteResponse> result = siteService.list(1L, null, "  unit  ", pageable);

        assertThat(result.getContent()).hasSize(1);
        // search is trimmed before hitting the repository
        verify(siteRepository).findByClientIdAndStatusAndSearch(1L, SiteStatus.ACTIVE, "unit", pageable);
    }

    @Test
    void listWithoutClientListsWholeCatalog() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<InspectionSite> page = new PageImpl<>(List.of(buildSite(activeClient())));
        when(siteRepository.findByStatus(SiteStatus.INACTIVE, pageable)).thenReturn(page);

        Page<SiteResponse> result = siteService.list(null, SiteStatus.INACTIVE, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(siteRepository).findByStatus(SiteStatus.INACTIVE, pageable);
        verify(siteRepository, never()).findByClientIdAndStatus(any(), any(), any());
    }

    @Test
    void findByIdReturnsSiteWhenPresent() {
        InspectionSite site = buildSite(activeClient());
        when(siteRepository.findById(10L)).thenReturn(Optional.of(site));

        SiteResponse response = siteService.findById(10L);

        assertThat(response.name()).isEqualTo("Unit A");
        assertThat(response.clientName()).isEqualTo("ACME");
    }

    @Test
    void findByIdThrowsWhenMissing() {
        when(siteRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> siteService.findById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void createPersistsSiteForActiveClient() {
        Client client = activeClient();
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));
        when(siteRepository.save(any(InspectionSite.class))).thenAnswer(inv -> inv.getArgument(0));

        SiteResponse response = siteService.create(buildCreateRequest());

        assertThat(response.name()).isEqualTo("New Site");
        assertThat(response.status()).isEqualTo(SiteStatus.ACTIVE);
        verify(siteRepository).save(any(InspectionSite.class));
    }

    @Test
    void createThrowsWhenClientMissing() {
        when(clientRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> siteService.create(buildCreateRequest()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("1");
        verify(siteRepository, never()).save(any());
    }

    @Test
    void createThrowsWhenClientInactive() {
        Client client = activeClient();
        client.setStatus(ClientStatus.INACTIVE);
        when(clientRepository.findById(1L)).thenReturn(Optional.of(client));

        assertThatThrownBy(() -> siteService.create(buildCreateRequest()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("inactive client");
        verify(siteRepository, never()).save(any());
    }

    @Test
    void updateChangesMutableFields() {
        InspectionSite site = buildSite(activeClient());
        when(siteRepository.findById(10L)).thenReturn(Optional.of(site));
        when(siteRepository.save(any(InspectionSite.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateSiteRequest request = new UpdateSiteRequest(
                "Renamed", "desc", "line", "City", "ST", "00000-000",
                null, null, "Contact", "119999");

        SiteResponse response = siteService.update(10L, request);

        assertThat(response.name()).isEqualTo("Renamed");
        assertThat(response.city()).isEqualTo("City");
    }

    @Test
    void deactivateSetsStatusInactive() {
        InspectionSite site = buildSite(activeClient());
        when(siteRepository.findById(10L)).thenReturn(Optional.of(site));

        siteService.deactivate(10L);

        assertThat(site.getStatus()).isEqualTo(SiteStatus.INACTIVE);
        verify(siteRepository).save(site);
    }

    @Test
    void deactivateThrowsWhenAlreadyInactive() {
        InspectionSite site = buildSite(activeClient());
        site.setStatus(SiteStatus.INACTIVE);
        when(siteRepository.findById(10L)).thenReturn(Optional.of(site));

        assertThatThrownBy(() -> siteService.deactivate(10L))
                .isInstanceOf(BusinessException.class);
        verify(siteRepository, never()).save(any());
    }

    @Test
    void activateSetsStatusActive() {
        InspectionSite site = buildSite(activeClient());
        site.setStatus(SiteStatus.INACTIVE);
        when(siteRepository.findById(10L)).thenReturn(Optional.of(site));

        siteService.activate(10L);

        assertThat(site.getStatus()).isEqualTo(SiteStatus.ACTIVE);
        verify(siteRepository).save(site);
    }

    @Test
    void activateThrowsWhenAlreadyActive() {
        InspectionSite site = buildSite(activeClient());
        when(siteRepository.findById(10L)).thenReturn(Optional.of(site));

        assertThatThrownBy(() -> siteService.activate(10L))
                .isInstanceOf(BusinessException.class);
        verify(siteRepository, never()).save(any());
    }

    // --- fixtures ---

    private Client activeClient() {
        Client client = new Client();
        client.setName("ACME");
        client.setStatus(ClientStatus.ACTIVE);
        return client;
    }

    private InspectionSite buildSite(Client client) {
        InspectionSite site = new InspectionSite();
        site.setClient(client);
        site.setName("Unit A");
        site.setStatus(SiteStatus.ACTIVE);
        return site;
    }

    private CreateSiteRequest buildCreateRequest() {
        return new CreateSiteRequest(
                1L, "New Site", "desc", "line", "City", "ST", "00000-000",
                null, null, "Contact", "119999");
    }
}
