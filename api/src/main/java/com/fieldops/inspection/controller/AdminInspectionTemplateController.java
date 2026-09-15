package com.fieldops.inspection.controller;

import com.fieldops.inspection.dto.InspectionTemplateRequest;
import com.fieldops.inspection.dto.InspectionTemplatePreviewResponse;
import com.fieldops.inspection.dto.InspectionTemplateResponse;
import com.fieldops.inspection.dto.InspectionTemplateSummary;
import com.fieldops.inspection.dto.InspectionTemplateVersionResponse;
import com.fieldops.inspection.dto.TemplateSectionRequest;
import com.fieldops.inspection.dto.TemplateSectionResponse;
import com.fieldops.inspection.dto.TemplateItemRequest;
import com.fieldops.inspection.dto.TemplateItemResponse;
import com.fieldops.inspection.model.InspectionTemplateStatus;
import com.fieldops.inspection.service.AdminCatalogListService;
import com.fieldops.inspection.service.InspectionTemplateService;
import com.fieldops.inspection.service.InspectionTemplateVersionService;
import com.fieldops.inspection.service.TemplateSectionService;
import com.fieldops.inspection.service.TemplateItemService;
import com.fieldops.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
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
    private final TemplateSectionService sectionService;
    private final TemplateItemService itemService;
    private final InspectionTemplateVersionService versionService;

    public AdminInspectionTemplateController(AdminCatalogListService listService,
            InspectionTemplateService templateService, TemplateSectionService sectionService,
            TemplateItemService itemService, InspectionTemplateVersionService versionService) {
        this.listService = listService;
        this.templateService = templateService;
        this.sectionService = sectionService;
        this.itemService = itemService;
        this.versionService = versionService;
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

    @Operation(summary = "Preview an inspection checklist and its publication issues")
    @ApiResponse(responseCode = "200", description = "Read-only checklist preview")
    @GetMapping("/{id}/preview")
    public ResponseEntity<InspectionTemplatePreviewResponse> preview(@PathVariable Long id) {
        return ResponseEntity.ok(templateService.preview(id));
    }

    @Operation(summary = "Update draft inspection template metadata")
    @PutMapping("/{id}")
    public ResponseEntity<InspectionTemplateResponse> update(@PathVariable Long id,
            @Valid @RequestBody InspectionTemplateRequest request) {
        return ResponseEntity.ok(templateService.updateDraft(id, request));
    }

    @Operation(summary = "Create a section in a draft inspection template")
    @ApiResponse(responseCode = "201", description = "Template section created")
    @PostMapping("/{id}/sections")
    public ResponseEntity<TemplateSectionResponse> createSection(@PathVariable Long id,
            @Valid @RequestBody TemplateSectionRequest request) {
        TemplateSectionResponse response = sectionService.create(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .location(java.net.URI.create("/api/v1/inspection-templates/" + id + "/sections/" + response.id()))
                .body(response);
    }

    @Operation(summary = "Update and reorder a section in a draft inspection template")
    @PutMapping("/{id}/sections/{sectionId}")
    public ResponseEntity<TemplateSectionResponse> updateSection(@PathVariable Long id,
            @PathVariable Long sectionId, @Valid @RequestBody TemplateSectionRequest request) {
        return ResponseEntity.ok(sectionService.update(id, sectionId, request));
    }

    @Operation(summary = "Delete a section from a draft inspection template")
    @ApiResponse(responseCode = "204", description = "Template section deleted")
    @DeleteMapping("/{id}/sections/{sectionId}")
    public ResponseEntity<Void> deleteSection(@PathVariable Long id, @PathVariable Long sectionId) {
        sectionService.delete(id, sectionId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Create an item in a draft template section")
    @ApiResponse(responseCode = "201", description = "Template item created")
    @PostMapping("/{id}/sections/{sectionId}/items")
    public ResponseEntity<TemplateItemResponse> createItem(@PathVariable Long id, @PathVariable Long sectionId,
            @Valid @RequestBody TemplateItemRequest request) {
        TemplateItemResponse response = itemService.create(id, sectionId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .location(java.net.URI.create("/api/v1/inspection-templates/" + id + "/sections/" + sectionId
                        + "/items/" + response.id()))
                .body(response);
    }

    @Operation(summary = "Update and reorder an item in a draft template section")
    @PutMapping("/{id}/sections/{sectionId}/items/{itemId}")
    public ResponseEntity<TemplateItemResponse> updateItem(@PathVariable Long id, @PathVariable Long sectionId,
            @PathVariable Long itemId, @Valid @RequestBody TemplateItemRequest request) {
        return ResponseEntity.ok(itemService.update(id, sectionId, itemId, request));
    }

    @Operation(summary = "Publish an immutable inspection template version")
    @ApiResponse(responseCode = "201", description = "Inspection template version published")
    @PostMapping("/{id}/publish")
    public ResponseEntity<InspectionTemplateVersionResponse> publish(@PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        InspectionTemplateVersionResponse response = versionService.publish(id, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .location(java.net.URI.create("/api/v1/inspection-templates/" + id + "/versions/" + response.id()))
                .body(response);
    }

    @Operation(summary = "List published versions of an inspection template")
    @GetMapping("/{id}/versions")
    public ResponseEntity<List<InspectionTemplateVersionResponse>> listVersions(@PathVariable Long id) {
        return ResponseEntity.ok(versionService.list(id));
    }
}
