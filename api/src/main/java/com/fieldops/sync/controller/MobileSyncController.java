package com.fieldops.sync.controller;

import com.fieldops.shared.security.AuthenticatedUser;
import com.fieldops.sync.dto.SyncPushRequest;
import com.fieldops.sync.dto.SyncPushResponse;
import com.fieldops.sync.service.SyncBatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Batch sync endpoint for the mobile client (PBI-051).
 */
@RestController
@RequestMapping("/api/v1/mobile/sync")
@Tag(name = "Mobile / Sync")
@SecurityRequirement(name = "bearer-jwt")
public class MobileSyncController {

    private final SyncBatchService syncBatchService;

    public MobileSyncController(SyncBatchService syncBatchService) {
        this.syncBatchService = syncBatchService;
    }

    @Operation(summary = "Push a batch of operations, ordered by dependencies, idempotently")
    @ApiResponse(responseCode = "200", description = "Per-operation results (applied/already/deferred/failed)")
    @PostMapping("/push")
    @PreAuthorize("hasAuthority('TECHNICIAN')")
    public ResponseEntity<SyncPushResponse> push(@Valid @RequestBody SyncPushRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(syncBatchService.push(request, user.getId()));
    }
}
