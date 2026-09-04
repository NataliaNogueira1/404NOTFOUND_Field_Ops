package com.fieldops.equipment.controller;

import com.fieldops.client.model.Client;
import com.fieldops.client.model.ClientStatus;
import com.fieldops.client.repository.ClientRepository;
import com.fieldops.equipment.model.Equipment;
import com.fieldops.equipment.model.EquipmentStatus;
import com.fieldops.equipment.repository.EquipmentRepository;
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

import java.util.UUID;

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
class EquipmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private InspectionSiteRepository siteRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Test
    void createsEquipmentLinkedToSiteWithAllFields() throws Exception {
        InspectionSite site = persistSite("Unidade Centro", SiteStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/equipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request(site.getId(), "Compressor", "FO-QR-001", "ACTIVE")))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location",
                        org.hamcrest.Matchers.matchesPattern("/api/v1/equipment/\\d+")))
                .andExpect(jsonPath("$.siteId").value(site.getId().toString()))
                .andExpect(jsonPath("$.siteName").value("Unidade Centro"))
                .andExpect(jsonPath("$.name").value("Compressor"))
                .andExpect(jsonPath("$.assetNumber").value("PAT-001"))
                .andExpect(jsonPath("$.qrCode").value("FO-QR-001"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.installedAt").value("2026-09-04"));

        assertThat(equipmentRepository.findAll()).singleElement()
                .extracting(equipment -> equipment.getSite().getId()).isEqualTo(site.getId());
    }

    @Test
    void listsEquipmentWithSiteStatusAndPaginationFilters() throws Exception {
        InspectionSite target = persistSite("Matriz", SiteStatus.ACTIVE);
        InspectionSite other = persistSite("Filial", SiteStatus.ACTIVE);
        persistEquipment(target, "Ativo", "FO-ACTIVE", EquipmentStatus.ACTIVE);
        persistEquipment(target, "Inativo", "FO-INACTIVE", EquipmentStatus.INACTIVE);
        persistEquipment(other, "Outro", "FO-OTHER", EquipmentStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/equipment")
                        .param("siteId", target.getId().toString()).param("status", "ACTIVE")
                        .param("page", "0").param("size", "1").param("sort", "name,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Ativo"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void listsAllEquipmentForOneSiteAndUpdatesSiteActiveCount() throws Exception {
        InspectionSite site = persistSite("Matriz", SiteStatus.ACTIVE);
        persistEquipment(site, "Bomba", "FO-BOMBA", EquipmentStatus.ACTIVE);
        persistEquipment(site, "Motor", "FO-MOTOR", EquipmentStatus.DECOMMISSIONED);

        mockMvc.perform(get("/api/v1/sites/{siteId}/equipment", site.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(get("/api/v1/sites/{siteId}", site.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.equipmentCount").value(1));
    }

    @Test
    @WithMockUser(authorities = "TECHNICIAN")
    void findsEquipmentByQrCodeForMobileScanner() throws Exception {
        Equipment equipment = persistEquipment(persistSite("Matriz", SiteStatus.ACTIVE),
                "Gerador", "FO-SCANNER-01", EquipmentStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/equipment/by-qr/{qrCode}", "FO-SCANNER-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(equipment.getId().toString()))
                .andExpect(jsonPath("$.name").value("Gerador"));
    }

    @Test
    void rejectsDuplicateQrCodeWithConflict() throws Exception {
        InspectionSite site = persistSite("Matriz", SiteStatus.ACTIVE);
        persistEquipment(site, "Existente", "FO-DUPLICATE", EquipmentStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/equipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request(site.getId(), "Novo", "FO-DUPLICATE", "ACTIVE")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
    }

    @Test
    void getsUpdatesAndDecommissionsEquipmentWithoutDeletingIt() throws Exception {
        InspectionSite site = persistSite("Matriz", SiteStatus.ACTIVE);
        Equipment equipment = persistEquipment(site, "Nome Antigo", "FO-EDIT", EquipmentStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/equipment/{id}", equipment.getId()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Nome Antigo"));

        mockMvc.perform(put("/api/v1/equipment/{id}", equipment.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request(site.getId(), "Nome Novo", "FO-EDIT", "INACTIVE")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Nome Novo"))
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        mockMvc.perform(patch("/api/v1/equipment/{id}/status", equipment.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DECOMMISSIONED\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DECOMMISSIONED"));

        assertThat(equipmentRepository.findById(equipment.getId())).isPresent()
                .get().extracting(Equipment::getStatus).isEqualTo(EquipmentStatus.DECOMMISSIONED);
    }

    @Test
    void validatesRequiredFieldsAndRejectsInactiveSite() throws Exception {
        mockMvc.perform(post("/api/v1/equipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"qrCode\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.length()").value(4));

        InspectionSite inactive = persistSite("Inativo", SiteStatus.INACTIVE);
        mockMvc.perform(post("/api/v1/equipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request(inactive.getId(), "Bomba", "FO-INACTIVE-SITE", "ACTIVE")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));
    }

    @Test
    void returnsNotFoundForUnknownIdAndQrCode() throws Exception {
        mockMvc.perform(get("/api/v1/equipment/{id}", Long.MAX_VALUE))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/equipment/by-qr/{qrCode}", "UNKNOWN"))
                .andExpect(status().isNotFound());
    }

    private InspectionSite persistSite(String name, SiteStatus status) {
        Client client = new Client();
        client.setName("Client " + UUID.randomUUID());
        client.setStatus(ClientStatus.ACTIVE);
        clientRepository.saveAndFlush(client);
        InspectionSite site = new InspectionSite();
        site.setClient(client);
        site.setName(name);
        site.setStatus(status);
        return siteRepository.saveAndFlush(site);
    }

    private Equipment persistEquipment(InspectionSite site, String name, String qrCode, EquipmentStatus status) {
        Equipment equipment = new Equipment();
        equipment.setSite(site);
        equipment.setName(name);
        equipment.setQrCode(qrCode);
        equipment.setStatus(status);
        return equipmentRepository.saveAndFlush(equipment);
    }

    private String request(Long siteId, String name, String qrCode, String status) {
        return """
                {"siteId":%s,"name":"%s","assetNumber":"PAT-001","serialNumber":"SN-001",
                 "manufacturer":"Atlas","model":"XPTO","description":"Compressor industrial",
                 "qrCode":"%s","status":"%s","installedAt":"2026-09-04"}
                """.formatted(siteId, name, qrCode, status);
    }
}
