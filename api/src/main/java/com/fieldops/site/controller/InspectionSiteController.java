package com.fieldops.site.controller;

import com.fieldops.site.dto.CreateSiteRequest;
import com.fieldops.site.dto.SiteResponse;
import com.fieldops.site.dto.UpdateSiteRequest;
import com.fieldops.site.model.SiteStatus;
import com.fieldops.site.service.InspectionSiteService;
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
 * CRUD endpoints for Inspection Site management.
 * Access: ADMINISTRATOR and SUPERVISOR roles.
 */
@RestController
@RequestMapping("/api/v1/sites")
@Tag(name = "Inspection Sites")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class InspectionSiteController {

    private final InspectionSiteService siteService;

    public InspectionSiteController(InspectionSiteService siteService) {
        this.siteService = siteService;
    }

    @Operation(summary = "List sites (paginated, filterable). Optionally scoped by client.")
    @GetMapping
    public ResponseEntity<Page<SiteResponse>> list(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) SiteStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(siteService.list(clientId, status, search, pageable));
    }

    @Operation(summary = "Get site by ID")
    @GetMapping("/{id}")
    public ResponseEntity<SiteResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(siteService.findById(id));
    }

    @Operation(summary = "Create a new inspection site")
    @PostMapping
    public ResponseEntity<SiteResponse> create(@Valid @RequestBody CreateSiteRequest request) {
        SiteResponse created = siteService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "Update an existing inspection site")
    @PutMapping("/{id}")
    public ResponseEntity<SiteResponse> update(@PathVariable Long id,
                                                @Valid @RequestBody UpdateSiteRequest request) {
        return ResponseEntity.ok(siteService.update(id, request));
    }

    @Operation(summary = "Deactivate a site (logical deletion)")
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        siteService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Reactivate a site")
    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        siteService.activate(id);
        return ResponseEntity.noContent().build();
    }
}
