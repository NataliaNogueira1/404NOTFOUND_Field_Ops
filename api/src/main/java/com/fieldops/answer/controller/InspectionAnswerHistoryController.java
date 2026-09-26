package com.fieldops.answer.controller;

import com.fieldops.answer.service.InspectionAnswerHistoryResponse;
import com.fieldops.answer.service.InspectionAnswerHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inspections")
@Tag(name = "Inspection answers")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class InspectionAnswerHistoryController {

    private final InspectionAnswerHistoryService inspectionAnswerHistoryService;

    public InspectionAnswerHistoryController(InspectionAnswerHistoryService inspectionAnswerHistoryService) {
        this.inspectionAnswerHistoryService = inspectionAnswerHistoryService;
    }

    @Operation(summary = "Get the answer history of an inspection")
    @ApiResponse(responseCode = "200", description = "Answers ordered by section, item, and submission time")
    @ApiResponse(responseCode = "404", description = "Inspection not found")
    @GetMapping("/{id}/answers/history")
    public ResponseEntity<List<InspectionAnswerHistoryResponse>> history(@PathVariable Long id) {
        return ResponseEntity.ok(inspectionAnswerHistoryService.history(id));
    }
}
