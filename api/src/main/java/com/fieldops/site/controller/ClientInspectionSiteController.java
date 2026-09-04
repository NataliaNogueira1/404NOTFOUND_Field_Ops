package com.fieldops.site.controller;

import com.fieldops.site.dto.InspectionSiteResponse;
import com.fieldops.site.service.InspectionSiteService;
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
@RequestMapping("/api/v1/clients/{clientId}/sites")
@Tag(name = "Inspection sites")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class ClientInspectionSiteController {

    private final InspectionSiteService siteService;

    public ClientInspectionSiteController(InspectionSiteService siteService) {
        this.siteService = siteService;
    }

    @Operation(summary = "List inspection sites belonging to a client")
    @ApiResponse(responseCode = "200", description = "Client inspection sites")
    @GetMapping
    public ResponseEntity<List<InspectionSiteResponse>> listByClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(siteService.listByClient(clientId));
    }
}
