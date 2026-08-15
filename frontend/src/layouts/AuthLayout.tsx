import { Outlet } from 'react-router-dom'
export function AuthLayout() { return <main className="grid min-h-screen place-items-center bg-app-bg px-4 py-10"><div className="w-full"><Outlet /></div></main> }
