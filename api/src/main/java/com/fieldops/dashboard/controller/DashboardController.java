package com.fieldops.dashboard.controller;

import com.fieldops.dashboard.dto.DashboardSummaryResponse;
import com.fieldops.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Return aggregated inspection indicators for the operations dashboard")
    @ApiResponse(responseCode = "200", description = "Dashboard summary returned")
    @ApiResponse(responseCode = "403", description = "Technicians cannot access the dashboard")
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> summary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(name = "client", required = false) String clientName,
            @RequestParam(required = false) Long technicianId) {
        return ResponseEntity.ok(dashboardService.getSummary(from, to, clientName, technicianId));
    }
}
