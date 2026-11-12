package com.fieldops.nonconformity.controller;

import com.fieldops.nonconformity.dto.NonConformityResponse;
import com.fieldops.nonconformity.dto.NonConformityRequest;
import com.fieldops.nonconformity.model.NonConformitySeverity;
import com.fieldops.nonconformity.model.NonConformityStatus;
import com.fieldops.nonconformity.service.NonConformityQueryService;
import com.fieldops.nonconformity.service.NonConformityManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/non-conformities")
@Tag(name = "Non-conformities")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class NonConformityController {

    private final NonConformityQueryService nonConformityQueryService;
    private final NonConformityManagementService managementService;

    public NonConformityController(NonConformityQueryService nonConformityQueryService,
            NonConformityManagementService managementService) {
        this.nonConformityQueryService = nonConformityQueryService;
        this.managementService = managementService;
    }

    @Operation(summary = "List non-conformities with optional filters and pagination")
    @ApiResponse(responseCode = "200", description = "Paginated list of non-conformities returned")
    @ApiResponse(responseCode = "403", description = "Technicians cannot list non-conformities")
    @GetMapping
    public ResponseEntity<Page<NonConformityResponse>> list(
            @RequestParam(required = false) Long inspectionId,
            @RequestParam(name = "client", required = false) String client,
            @RequestParam(required = false) NonConformitySeverity severity,
            @RequestParam(required = false) NonConformityStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(nonConformityQueryService.list(inspectionId, client, severity, status, pageable));
    }

    @Operation(summary = "Create a non-conformity")
    @ApiResponse(responseCode = "201", description = "Non-conformity created")
    @ApiResponse(responseCode = "400", description = "Invalid data or critical non-conformity has no evidence")
    @PostMapping
    public ResponseEntity<NonConformityResponse> create(@Valid @RequestBody NonConformityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(managementService.create(request));
    }

    @Operation(summary = "Get a non-conformity")
    @GetMapping("/{id}")
    public ResponseEntity<NonConformityResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(managementService.get(id));
    }

    @Operation(summary = "Update a non-conformity")
    @ApiResponse(responseCode = "400", description = "Critical non-conformity has no evidence")
    @PutMapping("/{id}")
    public ResponseEntity<NonConformityResponse> update(@PathVariable Long id,
            @Valid @RequestBody NonConformityRequest request) {
        return ResponseEntity.ok(managementService.update(id, request));
    }

    @Operation(summary = "Delete a non-conformity")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        managementService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
