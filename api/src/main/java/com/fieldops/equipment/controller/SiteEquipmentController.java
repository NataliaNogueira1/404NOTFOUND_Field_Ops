package com.fieldops.equipment.controller;

import com.fieldops.equipment.dto.EquipmentResponse;
import com.fieldops.equipment.service.EquipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
@RestController
@RequestMapping("/api/v1/sites/{siteId}/equipment")
@Tag(name = "Equipment")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class SiteEquipmentController {

    private final EquipmentService equipmentService;

    public SiteEquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @Operation(summary = "List all equipment belonging to an inspection site")
    @ApiResponse(responseCode = "200", description = "Inspection site equipment")
    @GetMapping
    public ResponseEntity<List<EquipmentResponse>> listBySite(@PathVariable Long siteId) {
        return ResponseEntity.ok(equipmentService.listBySite(siteId));
    }
}
