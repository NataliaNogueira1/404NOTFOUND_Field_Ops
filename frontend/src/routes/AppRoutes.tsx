import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(module => ({ default: module.DashboardPage })))
const UsersPage = lazy(() => import('@/pages/admin/UsersPage').then(module => ({ default: module.UsersPage })))
const ClientsPage = lazy(() => import('@/pages/catalog/ClientsPage').then(module => ({ default: module.ClientsPage })))
const ClientDetailsPage = lazy(() => import('@/pages/catalog/ClientsPage').then(module => ({ default: module.ClientDetailsPage })))
const ClientSiteDetailsPage = lazy(() => import('@/pages/catalog/ClientsPage').then(module => ({ default: module.ClientSiteDetailsPage })))
const TemplatesPage = lazy(() => import('@/pages/inspectionTemplates/TemplatesPage').then(module => ({ default: module.TemplatesPage })))
const TemplateBuilderPage = lazy(() => import('@/pages/inspectionTemplates/TemplateBuilderPage').then(module => ({ default: module.TemplateBuilderPage })))
const TemplatePreviewPage = lazy(() => import('@/pages/inspectionTemplates/TemplatePreviewPage').then(module => ({ default: module.TemplatePreviewPage })))
const InspectionsPage = lazy(() => import('@/pages/inspections/InspectionsPage').then(module => ({ default: module.InspectionsPage })))
const NewInspectionPage = lazy(() => import('@/pages/inspections/NewInspectionPage').then(module => ({ default: module.NewInspectionPage })))
const InspectionReviewPage = lazy(() => import('@/pages/inspections/InspectionReviewPage').then(module => ({ default: module.InspectionReviewPage })))
const NonConformitiesPage = lazy(() => import('@/pages/nonConformities/NonConformitiesPage').then(module => ({ default: module.NonConformitiesPage })))
const AuditPage = lazy(() => import('@/pages/audit/AuditPage').then(module => ({ default: module.AuditPage })))

function LoadingRoute() { return <div className="rounded-card border border-border bg-white p-6 text-sm text-muted shadow-fieldops">Carregando tela...</div> }
function LazyPage({ children }: { children: React.ReactNode }) { return <Suspense fallback={<LoadingRoute />}>{children}</Suspense> }

export function AppRoutes() {
  return <Routes>
    <Route element={<AuthLayout />}><Route path="/login" element={<LoginPage />} /></Route>
    <Route path="/app" element={<AppLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<LazyPage><DashboardPage /></LazyPage>} />
      <Route path="users" element={<LazyPage><UsersPage /></LazyPage>} />
      <Route path="clients" element={<LazyPage><ClientsPage /></LazyPage>} />
      <Route path="clients/:clientId" element={<LazyPage><ClientDetailsPage /></LazyPage>} />
      <Route path="clients/:clientId/sites/:siteId" element={<LazyPage><ClientSiteDetailsPage /></LazyPage>} />
      <Route path="sites" element={<Navigate to="/app/clients" replace />} />
      <Route path="equipment" element={<Navigate to="/app/clients" replace />} />
      <Route path="inspection-templates" element={<LazyPage><TemplatesPage /></LazyPage>} />
      <Route path="inspection-templates/:id/edit" element={<LazyPage><TemplateBuilderPage /></LazyPage>} />
      <Route path="inspection-templates/:id/preview" element={<LazyPage><TemplatePreviewPage /></LazyPage>} />
      <Route path="inspections" element={<LazyPage><InspectionsPage /></LazyPage>} />
      <Route path="inspections/new" element={<LazyPage><NewInspectionPage /></LazyPage>} />
      <Route path="inspections/:id/review" element={<LazyPage><InspectionReviewPage /></LazyPage>} />
      <Route path="non-conformities" element={<LazyPage><NonConformitiesPage /></LazyPage>} />
      <Route path="audit" element={<LazyPage><AuditPage /></LazyPage>} />
    </Route>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
}
