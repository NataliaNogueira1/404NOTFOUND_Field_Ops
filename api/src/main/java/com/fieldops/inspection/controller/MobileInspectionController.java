package com.fieldops.inspection.controller;

import com.fieldops.inspection.dto.InspectionResponse;
import com.fieldops.inspection.model.InspectionStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Mobile-facing inspections endpoint. STUB: returns sample data so the mobile app can build
 * against the contract before the inspections domain is implemented.
 */
@RestController
@RequestMapping("/api/v1/mobile/inspections")
@Tag(name = "Mobile / Inspections")
@SecurityRequirement(name = "bearer-jwt")
public class MobileInspectionController {

    private static final String EXAMPLE = """
            [
              {
                "id": 1,
                "title": "Inspeção trimestral - Bomba centrífuga BC-200",
                "status": "SCHEDULED",
                "scheduledDate": "2026-09-01",
                "clientName": "Indústria Atlas",
                "equipmentName": "Bomba centrífuga BC-200",
                "technicianName": "Carlos Souza"
              },
              {
                "id": 2,
                "title": "Inspeção de segurança - Caldeira CL-10",
                "status": "IN_PROGRESS",
                "scheduledDate": "2026-09-02",
                "clientName": "Metalúrgica Vega",
                "equipmentName": "Caldeira CL-10",
                "technicianName": "Carlos Souza"
              }
            ]
            """;

    @Operation(summary = "List inspections assigned to the authenticated technician")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inspections assigned to the technician",
                    content = @Content(examples = @ExampleObject(value = EXAMPLE)))
    })
    @GetMapping
    public ResponseEntity<List<InspectionResponse>> list() {
        return ResponseEntity.ok(sampleInspections());
    }

    private static List<InspectionResponse> sampleInspections() {
        return List.of(
                new InspectionResponse(1L, "Inspeção trimestral - Bomba centrífuga BC-200",
                        InspectionStatus.SCHEDULED, "2026-09-01", "Indústria Atlas",
                        "Bomba centrífuga BC-200", "Carlos Souza"),
                new InspectionResponse(2L, "Inspeção de segurança - Caldeira CL-10",
                        InspectionStatus.IN_PROGRESS, "2026-09-02", "Metalúrgica Vega",
                        "Caldeira CL-10", "Carlos Souza"));
    }
}
