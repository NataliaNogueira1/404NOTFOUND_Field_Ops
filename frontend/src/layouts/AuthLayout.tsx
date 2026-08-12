import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-50 px-4 py-10"><div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/50 blur-3xl" /><div className="absolute -bottom-48 -right-32 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" /><div className="relative z-10 w-full"><Outlet /></div></main>
}
