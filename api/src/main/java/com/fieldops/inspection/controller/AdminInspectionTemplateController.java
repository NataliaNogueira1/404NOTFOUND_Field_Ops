package com.fieldops.inspection.controller;

import com.fieldops.inspection.dto.InspectionTemplateRequest;
import com.fieldops.inspection.dto.InspectionTemplateResponse;
import com.fieldops.inspection.dto.InspectionTemplateSummary;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.service.AdminCatalogListService;
import com.fieldops.inspection.service.InspectionTemplateService;
import com.fieldops.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inspection-templates")
@Tag(name = "Inspection templates")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class AdminInspectionTemplateController {

    private final AdminCatalogListService listService;
    private final InspectionTemplateService templateService;

    public AdminInspectionTemplateController(AdminCatalogListService listService,
            InspectionTemplateService templateService) {
        this.listService = listService;
        this.templateService = templateService;
    }

    @Operation(summary = "List inspection templates with filters, sorting, and pagination")
    @ApiResponse(responseCode = "200", description = "Paginated inspection template list")
    @GetMapping
    public ResponseEntity<Page<InspectionTemplateSummary>> list(@RequestParam(required = false) String name,
            @RequestParam(required = false) InspectionTemplateStatus status, Pageable pageable) {
        return ResponseEntity.ok(listService.listTemplates(name, status, pageable));
    }

    @Operation(summary = "Create an inspection template in draft status")
    @ApiResponse(responseCode = "201", description = "Draft inspection template created")
    @PostMapping
    public ResponseEntity<InspectionTemplateResponse> create(@Valid @RequestBody InspectionTemplateRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        InspectionTemplateResponse response = templateService.createDraft(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .location(java.net.URI.create("/api/v1/inspection-templates/" + response.id()))
                .body(response);
    }

    @Operation(summary = "Get an inspection template")
    @GetMapping("/{id}")
    public ResponseEntity<InspectionTemplateResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(templateService.getById(id));
    }

    @Operation(summary = "Update draft inspection template metadata")
    @PutMapping("/{id}")
    public ResponseEntity<InspectionTemplateResponse> update(@PathVariable Long id,
            @Valid @RequestBody InspectionTemplateRequest request) {
        return ResponseEntity.ok(templateService.updateDraft(id, request));
    }
}
