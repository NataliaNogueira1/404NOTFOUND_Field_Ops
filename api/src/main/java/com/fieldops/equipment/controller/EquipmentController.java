package com.fieldops.equipment.controller;

import com.fieldops.equipment.dto.CreateEquipmentRequest;
import com.fieldops.equipment.dto.EquipmentResponse;
import com.fieldops.equipment.dto.UpdateEquipmentRequest;
import com.fieldops.equipment.model.EquipmentStatus;
import com.fieldops.equipment.service.EquipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
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

/**
 * CRUD endpoints for Equipment management.
 * Access: ADMINISTRATOR and SUPERVISOR roles.
 */
@RestController
@RequestMapping("/api/v1/equipment")
@Tag(name = "Equipment")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class EquipmentController {

    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @Operation(summary = "List equipment by site (paginated, filterable)")
    @GetMapping
    public ResponseEntity<Page<EquipmentResponse>> listBySite(
            @RequestParam Long siteId,
            @RequestParam(required = false) EquipmentStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(equipmentService.listBySite(siteId, status, search, pageable));
    }

    @Operation(summary = "Get equipment by ID")
    @GetMapping("/{id}")
    public ResponseEntity<EquipmentResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.findById(id));
    }

    @Operation(summary = "Find equipment by QR code")
    @GetMapping("/qr/{qrCode}")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR', 'TECHNICIAN')")
    public ResponseEntity<EquipmentResponse> findByQrCode(@PathVariable String qrCode) {
        return ResponseEntity.ok(equipmentService.findByQrCode(qrCode));
    }

    @Operation(summary = "Create a new equipment")
    @PostMapping
    public ResponseEntity<EquipmentResponse> create(@Valid @RequestBody CreateEquipmentRequest request) {
        EquipmentResponse created = equipmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "Update an existing equipment")
    @PutMapping("/{id}")
    public ResponseEntity<EquipmentResponse> update(@PathVariable Long id,
                                                     @Valid @RequestBody UpdateEquipmentRequest request) {
        return ResponseEntity.ok(equipmentService.update(id, request));
    }

    @Operation(summary = "Deactivate equipment (logical deletion)")
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        equipmentService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Decommission equipment (permanently retired)")
    @PatchMapping("/{id}/decommission")
    public ResponseEntity<Void> decommission(@PathVariable Long id) {
        equipmentService.decommission(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Reactivate equipment")
    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        equipmentService.activate(id);
        return ResponseEntity.noContent().build();
    }
}
