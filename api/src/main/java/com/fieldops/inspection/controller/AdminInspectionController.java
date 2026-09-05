package com.fieldops.inspection.controller;

import com.fieldops.inspection.dto.AdminInspectionSummary;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.service.AdminCatalogListService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/inspections")
@Tag(name = "Inspections")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class AdminInspectionController {

    private final AdminCatalogListService listService;

    public AdminInspectionController(AdminCatalogListService listService) {
        this.listService = listService;
    }

    @Operation(summary = "List inspections with filters, sorting, and pagination")
    @ApiResponse(responseCode = "200", description = "Paginated inspection list")
    @GetMapping
    public ResponseEntity<Page<AdminInspectionSummary>> list(@RequestParam(required = false) String name,
            @RequestParam(required = false) InspectionStatus status,
            @RequestParam(required = false) String technicianName,
            @RequestParam(required = false) String clientName,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueDate,
            @RequestParam(required = false) Boolean overdue,
            @RequestParam(required = false) Boolean review,
            Pageable pageable) {
        return ResponseEntity.ok(listService.listInspections(name, status, technicianName, clientName,
                priority, dueDate, overdue, review, pageable));
    }
}
