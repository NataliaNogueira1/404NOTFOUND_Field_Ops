package com.fieldops.evidence.controller;

import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.evidence.repository.InspectionEvidenceRepository;
import com.fieldops.evidence.storage.EvidenceStorage;
import com.fieldops.shared.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inspection-evidences")
@Tag(name = "Inspection evidences")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class InspectionEvidenceController {
    private final InspectionEvidenceRepository repository;
    private final EvidenceStorage storage;

    public InspectionEvidenceController(InspectionEvidenceRepository repository, EvidenceStorage storage) {
        this.repository = repository;
        this.storage = storage;
    }

    @Operation(summary = "Download the protected binary content of an inspection evidence")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Evidence binary content", content = @Content(mediaType = "application/octet-stream", schema = @Schema(type = "string", format = "binary"))),
            @ApiResponse(responseCode = "401", description = "Unauthenticated"),
            @ApiResponse(responseCode = "403", description = "Forbidden â€” only ADMINISTRATOR or SUPERVISOR"),
            @ApiResponse(responseCode = "404", description = "Evidence or stored file not found")
    })
    @GetMapping("/{id}/content")
    public ResponseEntity<FileSystemResource> content(@Parameter(description = "Evidence ID") @PathVariable Long id) throws IOException {
        InspectionEvidence evidence = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection evidence not found: " + id));
        Path file = storage.find(evidence.getReference())
                .orElseThrow(() -> new ResourceNotFoundException("Evidence content not found: " + id));
        String contentType = Files.probeContentType(file);
        MediaType mediaType = contentType == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contentType);
        return ResponseEntity.ok().contentType(mediaType).contentLength(Files.size(file)).body(new FileSystemResource(file));
    }
}
