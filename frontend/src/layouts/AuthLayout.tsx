import { Outlet } from 'react-router-dom'
import { ThemeToggle } from '@/theme/ThemeToggle'

export function AuthLayout() {
  return (
    <main className="relative grid min-h-screen place-items-center bg-app-bg px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full">
        <Outlet />
      </div>
    </main>
  )
}
