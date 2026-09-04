package com.fieldops.site.controller;

import com.fieldops.site.dto.SiteResponse;
import com.fieldops.site.model.SiteStatus;
import com.fieldops.site.service.InspectionSiteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Nested read endpoint for the sites that belong to a given client.
 * Mirrors the API contract: GET /api/v1/clients/{clientId}/sites.
 * Access: ADMINISTRATOR and SUPERVISOR roles.
 */
@RestController
@RequestMapping("/api/v1/clients/{clientId}/sites")
@Tag(name = "Inspection Sites")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class ClientSiteController {

    private final InspectionSiteService siteService;

    public ClientSiteController(InspectionSiteService siteService) {
        this.siteService = siteService;
    }

    @Operation(summary = "List the sites of a specific client (paginated, filterable)")
    @GetMapping
    public ResponseEntity<Page<SiteResponse>> listByClient(
            @PathVariable Long clientId,
            @RequestParam(required = false) SiteStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(siteService.list(clientId, status, search, pageable));
    }
}
