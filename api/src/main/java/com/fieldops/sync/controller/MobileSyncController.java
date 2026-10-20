package com.fieldops.sync.controller;

import com.fieldops.shared.security.AuthenticatedUser;
import com.fieldops.sync.dto.SyncPullResponse;
import com.fieldops.sync.dto.SyncPushRequest;
import com.fieldops.sync.dto.SyncPushResponse;
import com.fieldops.sync.service.SyncBatchService;
import com.fieldops.sync.service.SyncPullService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Batch sync endpoint for the mobile client (PBI-051) and incremental pull (PBI-053).
 */
@RestController
@RequestMapping("/api/v1/mobile/sync")
@Tag(name = "Mobile / Sync")
@SecurityRequirement(name = "bearer-jwt")
public class MobileSyncController {

    private final SyncBatchService syncBatchService;
    private final SyncPullService syncPullService;

    public MobileSyncController(SyncBatchService syncBatchService, SyncPullService syncPullService) {
        this.syncBatchService = syncBatchService;
        this.syncPullService = syncPullService;
    }

    @Operation(summary = "Push a batch of operations, ordered by dependencies, idempotently")
    @ApiResponse(responseCode = "200", description = "Per-operation results (applied/already/deferred/failed)")
    @PostMapping("/push")
    @PreAuthorize("hasAuthority('TECHNICIAN')")
    public ResponseEntity<SyncPushResponse> push(@Valid @RequestBody SyncPushRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(syncBatchService.push(request, user.getId()));
    }

    @Operation(summary = "Pull inspection changes assigned to the technician incrementally, by opaque cursor",
            description = "Returns changes ordered by (updatedAt, id) strictly after the cursor. "
                    + "Omit the cursor for the first sync. Use the returned nextCursor to resume.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "A page of changes plus nextCursor/hasMore"),
            @ApiResponse(responseCode = "401", description = "Missing or invalid access token"),
            @ApiResponse(responseCode = "403", description = "Authenticated user is not a technician"),
            @ApiResponse(responseCode = "422", description = "Malformed cursor (code INVALID_CURSOR)")
    })
    @GetMapping("/pull")
    @PreAuthorize("hasAuthority('TECHNICIAN')")
    public ResponseEntity<SyncPullResponse> pull(
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(syncPullService.pull(cursor, limit, user.getId()));
    }
}
