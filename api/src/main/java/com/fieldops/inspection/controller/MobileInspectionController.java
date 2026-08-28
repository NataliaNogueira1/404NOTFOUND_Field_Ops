package com.fieldops.inspection.controller;

import com.fieldops.inspection.dto.MobileInspectionResponse;
import com.fieldops.inspection.service.MobileInspectionService;
import com.fieldops.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Mobile-facing inspections endpoint. Returns inspections assigned to the authenticated
 * technician with the full template snapshot (sections + items) for offline use.
 */
@RestController
@RequestMapping("/api/v1/mobile/inspections")
@Tag(name = "Mobile / Inspections")
@SecurityRequirement(name = "bearer-jwt")
public class MobileInspectionController {

    private final MobileInspectionService service;

    public MobileInspectionController(MobileInspectionService service) {
        this.service = service;
    }

    @Operation(summary = "List inspections assigned to the authenticated technician")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inspections with template snapshot"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden — not a technician")
    })
    @GetMapping
    @PreAuthorize("hasAuthority('TECHNICIAN')")
    public ResponseEntity<List<MobileInspectionResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user) {
        List<MobileInspectionResponse> inspections = service.getInspectionsForTechnician(user.getId());
        return ResponseEntity.ok(inspections);
    }
}
