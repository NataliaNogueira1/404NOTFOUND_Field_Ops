package com.fieldops.client.controller;

import com.fieldops.client.model.Client;
import com.fieldops.client.model.ClientStatus;
import com.fieldops.client.repository.ClientRepository;
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
class ClientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ClientRepository clientRepository;

    @Test
    void listsClientsPaginated() throws Exception {
        // The test profile starts with an empty schema (no seed), so the list is empty but
        // must still return the standard Page envelope with 200.
        mockMvc.perform(get("/api/v1/clients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void createsClientWithCompleteResponse() throws Exception {
        mockMvc.perform(post("/api/v1/clients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"  Industria Atlas  ","legalName":"Atlas Industrial SA",
                                 "document":"12.345.678/0001-90","email":"contato@atlas.com",
                                 "phone":"(11) 99999-0000"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location",
                        org.hamcrest.Matchers.matchesPattern("/api/v1/clients/\\d+")))
                .andExpect(jsonPath("$.name").value("Industria Atlas"))
                .andExpect(jsonPath("$.legalName").value("Atlas Industrial SA"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.activeSitesCount").value(0))
                .andExpect(jsonPath("$.version").value(0));

        assertThat(clientRepository.findAll()).singleElement()
                .extracting(Client::getDocument).isEqualTo("12.345.678/0001-90");
    }

    @Test
    void listsClientsWithServerSideFiltersAndPagination() throws Exception {
        persist("Industria Atlas", ClientStatus.ACTIVE);
        persist("Comercial Inativa", ClientStatus.INACTIVE);

        mockMvc.perform(get("/api/v1/clients")
                        .param("name", "atlas")
                        .param("status", "ACTIVE")
                        .param("page", "0")
                        .param("size", "1")
                        .param("sort", "name,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Industria Atlas"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.size").value(1));
    }

    @Test
    void getsClientById() throws Exception {
        Client client = persist("Cliente Detalhado", ClientStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/clients/{id}", client.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(client.getId().toString()))
                .andExpect(jsonPath("$.name").value("Cliente Detalhado"));
    }

    @Test
    void updatesClientAndNormalizesBlankOptionalFields() throws Exception {
        Client client = persist("Nome Antigo", ClientStatus.ACTIVE);

        mockMvc.perform(put("/api/v1/clients/{id}", client.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Nome Novo","legalName":"","document":"",
                                 "email":"novo@example.com","phone":""}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Nome Novo"))
                .andExpect(jsonPath("$.email").value("novo@example.com"))
                .andExpect(jsonPath("$.legalName").doesNotExist())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void inactivatesClientWithoutDeletingIt() throws Exception {
        Client client = persist("Cliente Ativo", ClientStatus.ACTIVE);

        mockMvc.perform(patch("/api/v1/clients/{id}/status", client.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        assertThat(clientRepository.findById(client.getId())).isPresent()
                .get().extracting(Client::getStatus).isEqualTo(ClientStatus.INACTIVE);
    }

    @Test
    void rejectsInvalidNameDocumentAndEmail() throws Exception {
        mockMvc.perform(post("/api/v1/clients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"document\":\"123\",\"email\":\"invalid\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.length()").value(3));
    }

    @Test
    void returnsNotFoundForUnknownClient() throws Exception {
        mockMvc.perform(get("/api/v1/clients/{id}", Long.MAX_VALUE))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    private Client persist(String name, ClientStatus status) {
        Client client = new Client();
        client.setName(name);
        client.setStatus(status);
        return clientRepository.saveAndFlush(client);
    }
}
