package com.fieldops.report.service;

import com.fieldops.evidence.model.InspectionEvidence;
import com.fieldops.inspection.model.Inspection;
import com.fieldops.nonconformity.model.NonConformity;
import java.util.List;

/** Creates the binary representation of an inspection report. */
public interface InspectionReportDocument {

    byte[] generate(Inspection inspection, List<NonConformity> nonConformities,
            List<ReportAnswer> answers, List<InspectionEvidence> evidences);
}
