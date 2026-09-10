import { Modal } from '@/components/feedback/Modal'
import { Button } from '@/components/ui/Button'

export function PublicationIssuesDialog({ issues, open, onClose }: {
  issues: string[]
  open: boolean
  onClose: () => void
}) {
  return <Modal open={open} title="Pendencias para publicacao" onClose={onClose} footer={<Button onClick={onClose}>Entendi</Button>}>
    <p className="text-sm text-muted">Corrija os itens abaixo antes de publicar esta versao:</p>
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text">
      {issues.map(issue => <li key={issue}>{issue}</li>)}
    </ul>
  </Modal>
}
