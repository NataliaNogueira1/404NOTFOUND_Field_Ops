import { users } from '@/mocks/domain'
import { UserRole, type User } from '@/types/domain'

const SESSION_KEY = 'fieldops:mock-session'
type Listener = () => void

const listeners = new Set<Listener>()

function emit() {
  listeners.forEach(listener => listener())
}

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function readSession(): User | null {
  if (!storageAvailable()) return null
  const id = window.sessionStorage.getItem(SESSION_KEY)
  return users.find(user => user.id === id) ?? null
}

export const mockSession = {
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
  snapshot() {
    return readSession()
  },
  login(email: string) {
    const user = users.find(item => item.email.toLowerCase() === email.toLowerCase()) ?? null
    if (storageAvailable()) {
      if (user) window.sessionStorage.setItem(SESSION_KEY, user.id)
      else window.sessionStorage.removeItem(SESSION_KEY)
    }
    emit()
    return user
  },
  logout() {
    if (storageAvailable()) window.sessionStorage.removeItem(SESSION_KEY)
    emit()
  },
}

export function roleHome(role: UserRole) {
  return role === UserRole.TECHNICIAN ? '/technician/home' : '/app/dashboard'
}

export function canAccessAdmin(role: UserRole) {
  return role === UserRole.ADMIN || role === UserRole.SUPERVISOR
}

export function canAccessTechnician(role: UserRole) {
  return role === UserRole.TECHNICIAN
}
