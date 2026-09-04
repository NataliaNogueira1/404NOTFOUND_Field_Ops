package com.fieldops.site.controller;

import com.fieldops.site.dto.InspectionSiteRequest;
import com.fieldops.site.dto.InspectionSiteResponse;
import com.fieldops.site.dto.InspectionSiteStatusRequest;
import com.fieldops.site.model.SiteStatus;
import com.fieldops.site.service.InspectionSiteService;
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
@RequestMapping("/api/v1/sites")
@Tag(name = "Inspection sites")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class InspectionSiteController {

    private final InspectionSiteService siteService;

    public InspectionSiteController(InspectionSiteService siteService) {
        this.siteService = siteService;
    }

    @Operation(summary = "List inspection sites with name, client, and status filters")
    @ApiResponse(responseCode = "200", description = "Paginated inspection site list")
    @GetMapping
    public ResponseEntity<Page<InspectionSiteResponse>> list(@RequestParam(required = false) String name,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) SiteStatus status, Pageable pageable) {
        return ResponseEntity.ok(siteService.list(name, clientId, status, pageable));
    }

    @Operation(summary = "Get an inspection site")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inspection site found"),
            @ApiResponse(responseCode = "404", description = "Inspection site not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<InspectionSiteResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(siteService.get(id));
    }

    @Operation(summary = "Create an inspection site")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Inspection site created"),
            @ApiResponse(responseCode = "400", description = "Invalid inspection site data"),
            @ApiResponse(responseCode = "422", description = "Client is inactive")
    })
    @PostMapping
    public ResponseEntity<InspectionSiteResponse> create(@Valid @RequestBody InspectionSiteRequest request) {
        InspectionSiteResponse created = siteService.create(request);
        return ResponseEntity.created(URI.create("/api/v1/sites/" + created.id())).body(created);
    }

    @Operation(summary = "Update an inspection site")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inspection site updated"),
            @ApiResponse(responseCode = "404", description = "Inspection site or client not found")
    })
    @PutMapping("/{id}")
    public ResponseEntity<InspectionSiteResponse> update(@PathVariable Long id,
            @Valid @RequestBody InspectionSiteRequest request) {
        return ResponseEntity.ok(siteService.update(id, request));
    }

    @Operation(summary = "Activate or deactivate an inspection site")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inspection site status updated"),
            @ApiResponse(responseCode = "404", description = "Inspection site not found")
    })
    @PatchMapping("/{id}/status")
    public ResponseEntity<InspectionSiteResponse> updateStatus(@PathVariable Long id,
            @Valid @RequestBody InspectionSiteStatusRequest request) {
        return ResponseEntity.ok(siteService.updateStatus(id, request.status()));
    }
}
