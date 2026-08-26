import { ApiError, setUnauthorizedHandler, tokenStorage } from '@/api/client'
import { authApi, normalizeUser } from '@/api/auth'
import { UserRole, type User } from '@/types/domain'

type Status = 'loading' | 'authenticated' | 'anonymous'
type Listener = () => void
export interface AuthState { status: Status; user: User | null }

const listeners = new Set<Listener>()

let state: AuthState = tokenStorage.get() ? { status: 'loading', user: null } : { status: 'anonymous', user: null }
let restoreStarted = false

function emit() {
  listeners.forEach(listener => listener())
}

function setState(next: AuthState) {
  state = next
  emit()
}

function clearStoredSession() {
  tokenStorage.clear()
}

async function restoreSession() {
  if (!tokenStorage.get()) {
    setState({ status: 'anonymous', user: null })
    return
  }
  try {
    const user = await authApi.me()
    setState({ status: 'authenticated', user: normalizeUser(user) })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearStoredSession()
      setState({ status: 'anonymous', user: null })
      return
    }
    if (error instanceof ApiError && error.status === 403) {
      // A forbidden response is a permission problem, not an invalid session.
      setState({ status: 'anonymous', user: null })
      return
    }
    clearStoredSession()
    setState({ status: 'anonymous', user: null })
  }
}

export const authSession = {
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
  snapshot() {
    if (state.status === 'loading' && !restoreStarted) {
      restoreStarted = true
      void restoreSession()
    }
    return state
  },
  async login(email: string, password: string) {
    const response = await authApi.login(email, password)
    tokenStorage.set(response.accessToken)
    const user = normalizeUser(response.user)
    setState({ status: 'authenticated', user })
    return user
  },
  async restore() {
    restoreStarted = true
    await restoreSession()
  },
  logout() {
    clearStoredSession()
    setState({ status: 'anonymous', user: null })
  },
}

setUnauthorizedHandler(() => {
  clearStoredSession()
  setState({ status: 'anonymous', user: null })
})

export function roleHome(role: UserRole) {
  return role === UserRole.TECHNICIAN ? '/technician/home' : '/app/dashboard'
}

export function canAccessAdmin(role: UserRole) {
  return role === UserRole.ADMIN || role === UserRole.SUPERVISOR
}

export function canAccessTechnician(role: UserRole) {
  return role === UserRole.TECHNICIAN
}
