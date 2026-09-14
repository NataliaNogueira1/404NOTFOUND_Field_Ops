package com.fieldops.inspection.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.fieldops.inspection.model.Priority;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

/**
 * Bean-validation rules for CreateInspectionRequest (PBI-028 / #45):
 * supervisor instructions are optional but capped at 2000 characters.
 */
class CreateInspectionRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    @Test
    void acceptsInstructionsAtTheMaximumLength() {
        CreateInspectionRequest request = requestWithInstructions("a".repeat(2000));

        Set<ConstraintViolation<CreateInspectionRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }

    @Test
    void acceptsNullInstructions() {
        CreateInspectionRequest request = requestWithInstructions(null);

        Set<ConstraintViolation<CreateInspectionRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }

    @Test
    void rejectsInstructionsLongerThan2000Characters() {
        CreateInspectionRequest request = requestWithInstructions("a".repeat(2001));

        Set<ConstraintViolation<CreateInspectionRequest>> violations = validator.validate(request);

        assertThat(violations).singleElement()
                .satisfies(violation -> {
                    assertThat(violation.getPropertyPath()).hasToString("supervisorInstructions");
                    assertThat(violation.getMessage()).contains("2000");
                });
    }

    private CreateInspectionRequest requestWithInstructions(String instructions) {
        return new CreateInspectionRequest(
                "Preventive inspection", 7L, 11L, 12L, 13L, 14L, Priority.HIGH,
                LocalDate.now().plusDays(1), null, instructions);
    }
}
