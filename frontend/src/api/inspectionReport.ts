import { apiRequest } from '@/api/client'

/**
 * API module for the inspection PDF report (Task 196).
 *
 * The backend endpoint `GET /api/v1/inspections/{id}/report.pdf` generates
 * the PDF server-side using OpenPDF and returns it as application/pdf.
 * This module fetches the binary and triggers a browser download without
 * requiring a full-page navigation.
 */
export const inspectionReportApi = {
  /**
   * Downloads the server-generated PDF report for the given inspection ID.
   * Fetches the binary blob via the authenticated HTTP client (Bearer JWT),
   * creates a temporary object URL, and programmatically clicks a hidden
   * anchor to trigger the browser's "Save As" dialog, then releases the URL.
   */
  async downloadPdf(inspectionId: string): Promise<void> {
    const blob = await fetchReportBlob(inspectionId)
    const url = URL.createObjectURL(blob)
    try {
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `inspecao-${inspectionId}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
    } finally {
      // Revoke after a short delay to allow the browser to start the download.
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
    }
  },
}

/**
 * Fetches the PDF report blob for the given inspection ID using the
 * authenticated request helper (adds the Bearer JWT header).
 *
 * The `apiRequest` helper from client.ts handles:
 * - Adding the Authorization header
 * - Automatic token refresh on 401
 * - Throwing `ApiError` on non-2xx responses
 *
 * We need the raw Blob here, so we bypass `httpClient` (which parses JSON)
 * and use a dedicated fetch with the Accept header set to `application/pdf`.
 */
async function fetchReportBlob(inspectionId: string): Promise<Blob> {
  // Re-use the authenticated fetch infrastructure from client.ts by leveraging
  // apiRequest with a custom Accept header. Because apiRequest<Blob> would try
  // to JSON-parse the body, we instead call the raw `request` equivalent via a
  // fetch override. The simplest approach that keeps auth is to use fetch
  // directly with the stored token, matching the same pattern as requestBlob().
  const { tokenStorage } = await import('@/api/client')
  const API_URL = (import.meta.env.VITE_API_URL as string) ?? ''
  const token = tokenStorage.getAccessToken()

  const headers = new Headers({ Accept: 'application/pdf' })
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}/api/v1/inspections/${inspectionId}/report.pdf`, { headers })

  if (!response.ok) {
    const text = await response.text()
    let message = 'Nao foi possivel gerar o relatorio PDF.'
    try {
      const body = JSON.parse(text) as { message?: string }
      if (body.message) message = body.message
    } catch {
      // Non-JSON error body; use the default message.
    }
    const { ApiError } = await import('@/api/client')
    throw new ApiError({ status: response.status, code: 'REPORT_ERROR', message })
  }

  return response.blob()
}
