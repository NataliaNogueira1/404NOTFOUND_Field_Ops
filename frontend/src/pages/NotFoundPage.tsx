import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return <main className="grid min-h-screen place-items-center bg-app-bg p-6 text-center"><div><p className="text-sm font-bold text-primary">404</p><h1 className="mt-2 text-3xl font-bold">Página não encontrada</h1><p className="mt-2 text-muted">O endereço informado não existe no FieldOps.</p><Link to="/app/dashboard" className="mt-6 inline-block"><Button>Voltar ao dashboard</Button></Link></div></main>
}
