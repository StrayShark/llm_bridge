import { Modal } from './ui'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
  instanceName?: string
}

export default function ErrorModal({ isOpen, onClose, message, instanceName }: ErrorModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="连接失败" className="max-w-md">
      <div className="space-y-3">
        {instanceName && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span>实例:</span>
            <span className="font-medium text-on-surface">{instanceName}</span>
          </div>
        )}

        <div className="text-sm text-on-surface">
          {message}
        </div>
      </div>
    </Modal>
  )
}
