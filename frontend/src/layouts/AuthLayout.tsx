import { Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/theme/ThemeToggle'

export function AuthLayout() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-app-bg px-4 py-6 sm:py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full">
        <Outlet />
      </div>
    </main>
  )
}
