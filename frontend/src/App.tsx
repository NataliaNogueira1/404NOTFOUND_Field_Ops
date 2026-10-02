import { AppRoutes } from '@/routes/AppRoutes'
import { ThemeProvider } from '@/theme/ThemeProvider'

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  )
}
