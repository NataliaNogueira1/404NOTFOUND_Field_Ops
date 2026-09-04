package com.fieldops.inspection.controller;

import com.fieldops.inspection.dto.InspectionTemplateSummary;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.service.AdminCatalogListService;
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
@RequestMapping("/api/v1/inspection-templates")
@Tag(name = "Inspection templates")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class AdminInspectionTemplateController {

    private final AdminCatalogListService listService;

    public AdminInspectionTemplateController(AdminCatalogListService listService) {
        this.listService = listService;
    }

    @Operation(summary = "List inspection templates with filters, sorting, and pagination")
    @ApiResponse(responseCode = "200", description = "Paginated inspection template list")
    @GetMapping
    public ResponseEntity<Page<InspectionTemplateSummary>> list(@RequestParam(required = false) String name,
            @RequestParam(required = false) InspectionTemplateStatus status, Pageable pageable) {
        return ResponseEntity.ok(listService.listTemplates(name, status, pageable));
    }
}
