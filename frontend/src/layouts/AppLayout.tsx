import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return <div className="min-h-screen bg-app-bg"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="lg:pl-64"><Header onMenuClick={() => setSidebarOpen(true)} /><main className="p-5 lg:p-8"><Outlet /></main></div></div>
}
