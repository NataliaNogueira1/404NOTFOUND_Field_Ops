package com.fieldops.nonconformity.controller;

import com.fieldops.nonconformity.dto.NonConformityResponse;
import com.fieldops.nonconformity.model.NonConformitySeverity;
import com.fieldops.nonconformity.model.NonConformityStatus;
import com.fieldops.nonconformity.service.NonConformityQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
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

    public NonConformityController(NonConformityQueryService nonConformityQueryService) {
        this.nonConformityQueryService = nonConformityQueryService;
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
}
