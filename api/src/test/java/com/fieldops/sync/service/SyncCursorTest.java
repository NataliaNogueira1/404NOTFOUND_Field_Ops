package com.fieldops.sync.service;

import com.fieldops.shared.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for the opaque, monotonic sync cursor codec (PBI-053).
 * The cursor encodes the last delivered (updatedAt, id) pair so the server can
 * return only strictly-later records on the next pull.
 */
class SyncCursorTest {

    private final SyncCursor cursor = new SyncCursor();

    @Test
    void encodesAndDecodesTheUpdatedAtAndIdPairRoundTrip() {
        Instant updatedAt = Instant.ofEpochMilli(1_719_000_000_000L);
        long id = 42L;

        String encoded = cursor.encode(updatedAt, id);
        SyncCursor.Position position = cursor.decode(encoded);

        assertThat(position.updatedAt()).isEqualTo(updatedAt);
        assertThat(position.id()).isEqualTo(id);
    }

    @Test
    void producesAnOpaqueTokenThatIsNotTheRawPair() {
        String encoded = cursor.encode(Instant.ofEpochMilli(1_000L), 7L);

        assertThat(encoded).doesNotContain("|").doesNotContain("1000");
    }

    @Test
    void rejectsMalformedBase64WithInvalidCursorBusinessException() {
        assertThatThrownBy(() -> cursor.decode("###not-base64###"))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getCode()).isEqualTo("INVALID_CURSOR"));
    }

    @Test
    void rejectsDecodedTokenWithoutSeparatorWithInvalidCursorBusinessException() {
        String noSeparator = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString("1719000000000-42".getBytes());

        assertThatThrownBy(() -> cursor.decode(noSeparator))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getCode()).isEqualTo("INVALID_CURSOR"));
    }

    @Test
    void rejectsDecodedTokenWithNonNumericComponentsWithInvalidCursor() {
        String nonNumeric = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString("abc|def".getBytes());

        assertThatThrownBy(() -> cursor.decode(nonNumeric))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getCode()).isEqualTo("INVALID_CURSOR"));
    }
}
