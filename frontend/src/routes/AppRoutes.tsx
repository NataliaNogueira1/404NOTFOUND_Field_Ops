import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

export function AppRoutes() {
  return <Routes>
    <Route element={<AuthLayout />}><Route path="/login" element={<LoginPage />} /></Route>
    <Route path="/app" element={<AppLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="users" element={<PlaceholderPage title="Usuários" />} />
      <Route path="clients" element={<PlaceholderPage title="Clientes" />} />
      <Route path="sites" element={<PlaceholderPage title="Locais" />} />
      <Route path="equipment" element={<PlaceholderPage title="Equipamentos" />} />
      <Route path="inspection-templates" element={<PlaceholderPage title="Modelos de inspeção" />} />
      <Route path="inspection-templates/:id/edit" element={<PlaceholderPage title="Modelo de inspeção" mode="Editar" />} />
      <Route path="inspection-templates/:id/preview" element={<PlaceholderPage title="Modelo de inspeção" mode="Visualizar" />} />
      <Route path="inspections" element={<PlaceholderPage title="Inspeções" />} />
      <Route path="inspections/new" element={<PlaceholderPage title="Inspeção" mode="Nova" />} />
      <Route path="inspections/:id/review" element={<PlaceholderPage title="Inspeção" mode="Revisar" />} />
      <Route path="non-conformities" element={<PlaceholderPage title="Não conformidades" />} />
      <Route path="audit" element={<PlaceholderPage title="Auditoria" />} />
    </Route>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
}
