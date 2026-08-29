package com.fieldops.client.controller;

import com.fieldops.client.dto.ClientResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Clients endpoint. STUB: returns sample paginated data so the web admin can build against the
 * contract before the clients domain is implemented.
 */
@RestController
@RequestMapping("/api/v1/clients")
@Tag(name = "Clients")
@SecurityRequirement(name = "bearer-jwt")
@PreAuthorize("hasAnyAuthority('ADMINISTRATOR', 'SUPERVISOR')")
public class ClientController {

    private static final String EXAMPLE = """
            {
              "content": [
                { "id": 1, "name": "Indústria Atlas", "document": "12.345.678/0001-90", "email": "contato@atlas.com" },
                { "id": 2, "name": "Metalúrgica Vega", "document": "98.765.432/0001-10", "email": "ops@vega.com" }
              ],
              "pageable": { "pageNumber": 0, "pageSize": 20 },
              "totalPages": 3,
              "totalElements": 42,
              "number": 0,
              "size": 20
            }
            """;

    @Operation(summary = "List clients (paginated)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paginated list of clients",
                    content = @Content(examples = @ExampleObject(value = EXAMPLE))),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden — TECHNICIAN profile")
    })
    @GetMapping
    public ResponseEntity<Page<ClientResponse>> list(Pageable pageable) {
        return ResponseEntity.ok(new PageImpl<>(sampleClients(), pageable, 42));
    }

    private static List<ClientResponse> sampleClients() {
        return List.of(
                new ClientResponse(1L, "Indústria Atlas", "12.345.678/0001-90", "contato@atlas.com"),
                new ClientResponse(2L, "Metalúrgica Vega", "98.765.432/0001-10", "ops@vega.com"));
    }
}
