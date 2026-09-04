package com.fieldops.equipment.controller;

import com.fieldops.equipment.dto.EquipmentRequest;
import com.fieldops.equipment.dto.EquipmentResponse;
import com.fieldops.equipment.dto.EquipmentStatusRequest;
import com.fieldops.equipment.model.EquipmentStatus;
import com.fieldops.equipment.service.EquipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/equipment")
@Tag(name = "Equipment")
@SecurityRequirement(name = "bearer-jwt")
public class EquipmentController {

    private static final String MANAGE_EQUIPMENT = "hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')";
    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @Operation(summary = "List equipment with site and status filters")
    @ApiResponse(responseCode = "200", description = "Paginated equipment list")
    @PreAuthorize(MANAGE_EQUIPMENT)
    @GetMapping
    public ResponseEntity<Page<EquipmentResponse>> list(@RequestParam(required = false) Long siteId,
            @RequestParam(required = false) EquipmentStatus status, Pageable pageable) {
        return ResponseEntity.ok(equipmentService.list(siteId, status, pageable));
    }

    @Operation(summary = "Get equipment by identifier")
    @ApiResponse(responseCode = "200", description = "Equipment found")
    @PreAuthorize(MANAGE_EQUIPMENT)
    @GetMapping("/{id}")
    public ResponseEntity<EquipmentResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.get(id));
    }

    @Operation(summary = "Find equipment by its unique QR code")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Equipment found"),
            @ApiResponse(responseCode = "404", description = "QR code not found")
    })
    @PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR', 'TECHNICIAN')")
    @GetMapping("/by-qr/{qrCode}")
    public ResponseEntity<EquipmentResponse> getByQrCode(@PathVariable String qrCode) {
        return ResponseEntity.ok(equipmentService.getByQrCode(qrCode));
    }

    @Operation(summary = "Create equipment")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Equipment created"),
            @ApiResponse(responseCode = "409", description = "QR code already exists"),
            @ApiResponse(responseCode = "422", description = "Inspection site is inactive")
    })
    @PreAuthorize(MANAGE_EQUIPMENT)
    @PostMapping
    public ResponseEntity<EquipmentResponse> create(@Valid @RequestBody EquipmentRequest request) {
        EquipmentResponse created = equipmentService.create(request);
        return ResponseEntity.created(URI.create("/api/v1/equipment/" + created.id())).body(created);
    }

    @Operation(summary = "Update equipment")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Equipment updated"),
            @ApiResponse(responseCode = "409", description = "QR code already exists")
    })
    @PreAuthorize(MANAGE_EQUIPMENT)
    @PutMapping("/{id}")
    public ResponseEntity<EquipmentResponse> update(@PathVariable Long id,
            @Valid @RequestBody EquipmentRequest request) {
        return ResponseEntity.ok(equipmentService.update(id, request));
    }

    @Operation(summary = "Change equipment lifecycle status")
    @ApiResponse(responseCode = "200", description = "Equipment status updated")
    @PreAuthorize(MANAGE_EQUIPMENT)
    @PatchMapping("/{id}/status")
    public ResponseEntity<EquipmentResponse> updateStatus(@PathVariable Long id,
            @Valid @RequestBody EquipmentStatusRequest request) {
        return ResponseEntity.ok(equipmentService.updateStatus(id, request.status()));
    }
}
