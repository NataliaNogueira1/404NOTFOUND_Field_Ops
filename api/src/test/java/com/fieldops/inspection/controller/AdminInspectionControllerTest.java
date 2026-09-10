package com.fieldops.inspection.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fieldops.inspection.dto.CreateInspectionRequest;
import com.fieldops.inspection.dto.InspectionResponse;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.service.AdminCatalogListService;
import com.fieldops.inspection.service.InspectionService;
import com.fieldops.shared.security.AuthenticatedUser;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import java.net.URI;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AdminInspectionControllerTest {

    @Mock
    private AdminCatalogListService listService;

    @Mock
    private InspectionService inspectionService;

    @InjectMocks
    private AdminInspectionController controller;

    @Test
    void schedulesInspectionFromPublishedVersion() {
        CreateInspectionRequest request = new CreateInspectionRequest(
                "Preventive inspection", 7L, 11L, 12L, 13L, 14L, Priority.HIGH,
                LocalDate.now().plusDays(1), null, null);
        AuthenticatedUser principal = principal(15L);
        InspectionResponse response = new InspectionResponse(21L, request.title(), InspectionStatus.ASSIGNED,
                request.dueDate().toString(), "Acme", "Compressor", "Technician");
        when(inspectionService.createInspection(request, 15L)).thenReturn(response);

        ResponseEntity<InspectionResponse> result = controller.create(request, principal);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(result.getHeaders().getLocation()).isEqualTo(URI.create("/api/v1/inspections/21"));
        assertThat(result.getBody()).isEqualTo(response);
        verify(inspectionService).createInspection(request, 15L);
    }

    private AuthenticatedUser principal(Long id) {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", id);
        user.setName("Supervisor");
        user.setEmail("supervisor@fieldops.com");
        user.setPassword("hash");
        user.setRole(Role.SUPERVISOR);
        return new AuthenticatedUser(user);
    }
}
