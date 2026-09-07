package com.fieldops.site.controller;

import com.fieldops.client.model.Client;
import com.fieldops.client.model.ClientStatus;
import com.fieldops.client.repository.ClientRepository;
import com.fieldops.site.model.InspectionSite;
import com.fieldops.site.model.SiteStatus;
import com.fieldops.site.repository.InspectionSiteRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(authorities = "SUPERVISOR")
class InspectionSiteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private InspectionSiteRepository siteRepository;

    @Test
    void createsSiteLinkedToAnActiveClient() throws Exception {
        Client client = persistClient("Industria Atlas", ClientStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/sites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request(client.getId(), "Unidade Centro")))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location",
                        org.hamcrest.Matchers.matchesPattern("/api/v1/sites/\\d+")))
                .andExpect(jsonPath("$.clientId").value(client.getId().toString()))
                .andExpect(jsonPath("$.clientName").value("Industria Atlas"))
                .andExpect(jsonPath("$.name").value("Unidade Centro"))
                .andExpect(jsonPath("$.zipCode").value("01310-100"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.equipmentCount").value(0));

        assertThat(siteRepository.findAll()).singleElement()
                .extracting(site -> site.getClient().getId()).isEqualTo(client.getId());
    }

    @Test
    void listsSitesWithClientStatusAndServerPaginationFilters() throws Exception {
        Client atlas = persistClient("Atlas", ClientStatus.ACTIVE);
        Client other = persistClient("Outro", ClientStatus.ACTIVE);
        persistSite(atlas, "Unidade Centro", SiteStatus.ACTIVE);
        persistSite(atlas, "Unidade Inativa", SiteStatus.INACTIVE);
        persistSite(other, "Unidade Centro", SiteStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/sites")
                        .param("name", "centro")
                        .param("clientId", atlas.getId().toString())
                        .param("status", "ACTIVE")
                        .param("page", "0").param("size", "1").param("sort", "name,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Unidade Centro"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void listsAllSitesForOneClient() throws Exception {
        Client client = persistClient("Atlas", ClientStatus.ACTIVE);
        persistSite(client, "Filial", SiteStatus.INACTIVE);
        persistSite(client, "Matriz", SiteStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/clients/{clientId}/sites", client.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Filial"))
                .andExpect(jsonPath("$[1].name").value("Matriz"));
    }

    @Test
    void getsAndUpdatesSite() throws Exception {
        Client client = persistClient("Atlas", ClientStatus.ACTIVE);
        InspectionSite site = persistSite(client, "Nome Antigo", SiteStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/sites/{id}", site.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Nome Antigo"));

        mockMvc.perform(put("/api/v1/sites/{id}", site.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request(client.getId(), "Nome Novo")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Nome Novo"))
                .andExpect(jsonPath("$.city").value("Sao Paulo"));
    }

    @Test
    void inactivatesSiteWithoutDeletingAndUpdatesClientCount() throws Exception {
        Client client = persistClient("Atlas", ClientStatus.ACTIVE);
        InspectionSite site = persistSite(client, "Matriz", SiteStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/clients/{id}", client.getId()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.activeSitesCount").value(1));

        mockMvc.perform(patch("/api/v1/sites/{id}/status", site.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        assertThat(siteRepository.findById(site.getId())).isPresent();
        mockMvc.perform(get("/api/v1/clients/{id}", client.getId()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.activeSitesCount").value(0));
    }

    @Test
    void rejectsMissingClientInvalidZipCodeAndCoordinates() throws Exception {
        mockMvc.perform(post("/api/v1/sites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Local","zipCode":"123","latitude":91,"longitude":181}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.length()").value(4));
    }

    @Test
    void rejectsInactiveClientAndReturnsNotFoundForUnknownSite() throws Exception {
        Client inactive = persistClient("Inativo", ClientStatus.INACTIVE);

        mockMvc.perform(post("/api/v1/sites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request(inactive.getId(), "Local")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));

        mockMvc.perform(get("/api/v1/sites/{id}", Long.MAX_VALUE))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    private Client persistClient(String name, ClientStatus status) {
        Client client = new Client();
        client.setName(name);
        client.setStatus(status);
        return clientRepository.saveAndFlush(client);
    }

    private InspectionSite persistSite(Client client, String name, SiteStatus status) {
        InspectionSite site = new InspectionSite();
        site.setClient(client);
        site.setName(name);
        site.setStatus(status);
        return siteRepository.saveAndFlush(site);
    }

    private String request(Long clientId, String name) {
        return """
                {"clientId":%s,"name":"%s","description":"Entrada lateral",
                 "address":"Av. Paulista, 1000","city":"Sao Paulo","state":"SP",
                 "zipCode":"01310-100","latitude":-23.561684,"longitude":-46.655981,
                 "contactName":"Ana","contactPhone":"(11) 99999-0000"}
                """.formatted(clientId, name);
    }
}
