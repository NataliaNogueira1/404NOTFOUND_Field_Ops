package com.fieldops.dashboard.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fieldops.dashboard.dto.DashboardSummaryResponse;
import com.fieldops.nonconformity.model.NonConformityStatus;
import com.fieldops.nonconformity.repository.NonConformityRepository;
import com.fieldops.inspection.model.InspectionStatus;
import com.fieldops.inspection.model.Priority;
import com.fieldops.inspection.repository.InspectionRepository;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private InspectionRepository inspectionRepository;

    @Mock
    private NonConformityRepository nonConformityRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void returnsCompleteAggregationsAndAppliesAllOptionalFilters() {
        LocalDate from = LocalDate.of(2026, 9, 1);
        LocalDate to = LocalDate.of(2026, 9, 30);
        List<Object[]> statusRows = List.of(
                new Object[]{InspectionStatus.ASSIGNED, 2L},
                new Object[]{InspectionStatus.APPROVED, 4L});
        List<Object[]> priorityRows = List.<Object[]>of(new Object[]{Priority.HIGH, 2L});

        when(inspectionRepository.countByStatus(from, to, "Industria Modelo Ltda.", 12L))
                .thenReturn(statusRows);
        when(inspectionRepository.countByPriority(
                List.of(InspectionStatus.APPROVED, InspectionStatus.CANCELED, InspectionStatus.REJECTED),
                from, to, "Industria Modelo Ltda.", 12L))
                .thenReturn(priorityRows);
        when(inspectionRepository.countOverdue(
                LocalDate.now(),
                List.of(InspectionStatus.APPROVED, InspectionStatus.CANCELED, InspectionStatus.REJECTED),
                from, to, "Industria Modelo Ltda.", 12L))
                .thenReturn(3L);
        when(nonConformityRepository.countByStatusAndInspectionFilters(
                NonConformityStatus.OPEN, from, to, "Industria Modelo Ltda.", 12L))
                .thenReturn(5L);

        DashboardSummaryResponse summary = dashboardService.getSummary(
                from, to, "  Industria Modelo Ltda.  ", 12L);

        assertThat(summary.byStatus())
                .containsEntry("ASSIGNED", 2L)
                .containsEntry("APPROVED", 4L)
                .containsEntry("CANCELED", 0L);
        assertThat(summary.byCriticality())
                .containsEntry("HIGH", 2L)
                .containsEntry("CRITICAL", 0L);
        assertThat(summary.openNonConformities()).isEqualTo(5L);
        assertThat(summary.overdue()).isEqualTo(3L);

        verify(inspectionRepository).countByStatus(from, to, "Industria Modelo Ltda.", 12L);
        verify(inspectionRepository).countByPriority(
                List.of(InspectionStatus.APPROVED, InspectionStatus.CANCELED, InspectionStatus.REJECTED),
                from, to, "Industria Modelo Ltda.", 12L);
        verify(inspectionRepository).countOverdue(
                LocalDate.now(),
                List.of(InspectionStatus.APPROVED, InspectionStatus.CANCELED, InspectionStatus.REJECTED),
                from, to, "Industria Modelo Ltda.", 12L);
        verify(nonConformityRepository).countByStatusAndInspectionFilters(
                NonConformityStatus.OPEN, from, to, "Industria Modelo Ltda.", 12L);
    }
}
