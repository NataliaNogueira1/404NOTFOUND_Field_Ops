package com.fieldops.evidence.storage;

import java.io.InputStream;

/**
 * A readable evidence binary, independent of where it is stored (disk, object storage).
 * The caller owns the stream and must close it (the HTTP layer does so after writing the body).
 */
public record EvidenceContent(InputStream stream, long contentLength, String contentType) {
}
