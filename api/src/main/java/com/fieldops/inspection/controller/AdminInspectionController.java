package com.fieldops.inspection.controller;

import com.fieldops.inspection.dto.AdminInspectionSummary;
import com.fieldops.inspection.dto.CancelInspectionRequest;
import com.fieldops.inspection.dto.CancelInspectionResponse;
import com.fieldops.inspection.dto.CreateInspectionRequest;
import com.fieldops.inspection.dto.InspectionResponse;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.service.AdminCatalogListService;
import com.fieldops.inspection.service.InspectionService;
import com.fieldops.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import jakarta.validation.Valid;
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
    private final InspectionService inspectionService;

    public AdminInspectionController(AdminCatalogListService listService, InspectionService inspectionService) {
        this.listService = listService;
        this.inspectionService = inspectionService;
    }

    @Operation(summary = "Schedule an inspection from an immutable template version")
    @ApiResponse(responseCode = "201", description = "Inspection scheduled with checklist snapshot")
    @PostMapping
    public ResponseEntity<InspectionResponse> create(@Valid @RequestBody CreateInspectionRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        InspectionResponse response = inspectionService.createInspection(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .location(java.net.URI.create("/api/v1/inspections/" + response.id()))
                .body(response);
    }

    @Operation(summary = "Cancel an inspection with a mandatory justification")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inspection canceled"),
            @ApiResponse(responseCode = "404", description = "Inspection not found"),
            @ApiResponse(responseCode = "422", description = "Inspection cannot be canceled from its current status")
    })
    @PostMapping("/{id}/cancel")
    public ResponseEntity<CancelInspectionResponse> cancel(@PathVariable Long id,
            @Valid @RequestBody CancelInspectionRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(inspectionService.cancel(id, request.reason(), user.getId()));
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
