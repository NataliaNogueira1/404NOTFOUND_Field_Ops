import { lazy, Suspense, useSyncExternalStore } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { canAccessAdmin, canAccessTechnician, mockSession, roleHome } from '@/auth/mockSession'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { TechnicianLayout } from '@/layouts/TechnicianLayout'
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
const TechnicianHomePage = lazy(() => import('@/pages/technician/TechnicianPages').then(module => ({ default: module.TechnicianHomePage })))
const TechnicianInspectionsPage = lazy(() => import('@/pages/technician/TechnicianPages').then(module => ({ default: module.TechnicianInspectionsPage })))
const TechnicianInspectionDetailsPage = lazy(() => import('@/pages/technician/TechnicianPages').then(module => ({ default: module.TechnicianInspectionDetailsPage })))
const TechnicianStartInspectionPage = lazy(() => import('@/pages/technician/TechnicianPages').then(module => ({ default: module.TechnicianStartInspectionPage })))
const TechnicianChecklistPage = lazy(() => import('@/pages/technician/TechnicianPages').then(module => ({ default: module.TechnicianChecklistPage })))
const TechnicianNonConformitiesPage = lazy(() => import('@/pages/technician/TechnicianPages').then(module => ({ default: module.TechnicianNonConformitiesPage })))
const TechnicianSummaryPage = lazy(() => import('@/pages/technician/TechnicianPages').then(module => ({ default: module.TechnicianSummaryPage })))
const TechnicianSyncPage = lazy(() => import('@/pages/technician/TechnicianPages').then(module => ({ default: module.TechnicianSyncPage })))
const TechnicianProfilePage = lazy(() => import('@/pages/technician/TechnicianPages').then(module => ({ default: module.TechnicianProfilePage })))

function LoadingRoute() { return <div className="rounded-card border border-border bg-white p-6 text-sm text-muted shadow-fieldops">Carregando tela...</div> }
function LazyPage({ children }: { children: React.ReactNode }) { return <Suspense fallback={<LoadingRoute />}>{children}</Suspense> }

function RequireAdmin() {
  const user = useSyncExternalStore(mockSession.subscribe, mockSession.snapshot, mockSession.snapshot)
  if (!user) return <Navigate to="/login" replace />
  if (!canAccessAdmin(user.role)) return <Navigate to={roleHome(user.role)} replace />
  return <Outlet />
}

function RequireTechnician() {
  const user = useSyncExternalStore(mockSession.subscribe, mockSession.snapshot, mockSession.snapshot)
  if (!user) return <Navigate to="/login" replace />
  if (!canAccessTechnician(user.role)) return <Navigate to={roleHome(user.role)} replace />
  return <Outlet />
}

export function AppRoutes() {
  return <Routes>
    <Route element={<AuthLayout />}><Route path="/login" element={<LoginPage />} /></Route>
    <Route element={<RequireAdmin />}>
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
    </Route>
    <Route element={<RequireTechnician />}>
      <Route path="/technician" element={<TechnicianLayout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<LazyPage><TechnicianHomePage /></LazyPage>} />
        <Route path="inspections" element={<LazyPage><TechnicianInspectionsPage /></LazyPage>} />
        <Route path="inspections/:id" element={<LazyPage><TechnicianInspectionDetailsPage /></LazyPage>} />
        <Route path="inspections/:id/start" element={<LazyPage><TechnicianStartInspectionPage /></LazyPage>} />
        <Route path="inspections/:id/checklist" element={<LazyPage><TechnicianChecklistPage /></LazyPage>} />
        <Route path="inspections/:id/non-conformities" element={<LazyPage><TechnicianNonConformitiesPage /></LazyPage>} />
        <Route path="inspections/:id/summary" element={<LazyPage><TechnicianSummaryPage /></LazyPage>} />
        <Route path="sync" element={<LazyPage><TechnicianSyncPage /></LazyPage>} />
        <Route path="profile" element={<LazyPage><TechnicianProfilePage /></LazyPage>} />
      </Route>
    </Route>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
}
