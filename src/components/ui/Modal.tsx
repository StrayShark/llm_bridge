import * as React from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

const Modal = ({ isOpen, onClose, title, children, className = '' }: ModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`
        relative z-10 w-full max-w-2xl mx-4
        bg-surface-container rounded-lg shadow-ambient
        animate-slide-up
        ${className}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-surface-container-high">
          <h2 className="text-xl font-display font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-surface-container-high transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export { Modal }
