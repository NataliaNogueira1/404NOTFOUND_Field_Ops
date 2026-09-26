package com.fieldops.report.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.fieldops.inspection.repository.InspectionRepository;
import com.fieldops.nonconformity.repository.NonConformityRepository;
import com.fieldops.shared.exception.ResourceNotFoundException;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InspectionReportServiceTest {

    @Mock
    private InspectionRepository inspectionRepository;

    @Mock
    private NonConformityRepository nonConformityRepository;

    @Mock
    private InspectionReportDocument inspectionReportDocument;

    @InjectMocks
    private InspectionReportService inspectionReportService;

    @Test
    void throwsNotFoundWhenInspectionDoesNotExist() {
        when(inspectionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> inspectionReportService.generate(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Inspection not found: 999");
    }
}
