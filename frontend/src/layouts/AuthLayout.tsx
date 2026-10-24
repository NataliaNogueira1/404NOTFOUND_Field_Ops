import { Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/theme/ThemeToggle'

export function AuthLayout() {
  return (
    <main className="flex min-h-screen flex-col bg-app-bg px-4 py-6 sm:py-10">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>
      <div className="flex w-full flex-1 items-center justify-center py-6">
        <Outlet />
      </div>
    </main>
  )
}
