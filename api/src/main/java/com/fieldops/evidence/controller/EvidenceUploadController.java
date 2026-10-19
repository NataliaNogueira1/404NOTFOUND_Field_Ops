package com.fieldops.evidence.controller;

import com.fieldops.evidence.dto.EvidenceUploadRequest;
import com.fieldops.evidence.dto.EvidenceUploadResponse;
import com.fieldops.evidence.service.EvidenceUploadService;
import com.fieldops.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Technician-facing multipart evidence (photo) upload (PBI-221). Separate from the
 * ADMINISTRATOR/SUPERVISOR download controller so the technician-owned route stays isolated.
 */
@RestController
@RequestMapping("/api/v1/inspections")
@Tag(name = "Inspection evidence upload")
@SecurityRequirement(name = "bearer-jwt")
public class EvidenceUploadController {

    private final EvidenceUploadService uploadService;

    public EvidenceUploadController(EvidenceUploadService uploadService) {
        this.uploadService = uploadService;
    }

    @Operation(summary = "Upload a photo evidence for an inspection item (owner technician only)")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Evidence stored",
                    content = @Content(schema = @Schema(implementation = EvidenceUploadResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid payload"),
            @ApiResponse(responseCode = "403", description = "Not a technician"),
            @ApiResponse(responseCode = "404", description = "Inspection or item not found"),
            @ApiResponse(responseCode = "422", description = "Business rule violation (not owner, invalid location)")
    })
    @PostMapping(value = "/{id}/evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('TECHNICIAN')")
    public ResponseEntity<EvidenceUploadResponse> upload(
            @Parameter(description = "Inspection ID") @PathVariable Long id,
            @Valid @ModelAttribute EvidenceUploadRequest request,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal AuthenticatedUser user) {
        EvidenceUploadResponse response = uploadService.upload(id, request, file, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
