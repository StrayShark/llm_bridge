import { Database, Circle } from 'lucide-react';
import type { LLMConfig, GenerateResult } from '../core/types';

type InstanceStatus = 'idle' | 'loading' | 'success' | 'error'

interface InstanceCardProps {
  instance: LLMConfig
  state: {
    status: InstanceStatus
    lastResponse?: GenerateResult
    error?: string
  }
  isStored: boolean
  isSelected: boolean
  onToggleSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onShowError?: (message: string) => void
}

const STATUS_CONFIG = {
  idle: { dotColor: 'bg-surface-container-high' },
  loading: { dotColor: 'bg-tertiary animate-pulse' },
  success: { dotColor: 'bg-green-500' },
  error: { dotColor: 'bg-error' }
};

export default function InstanceCard({
  instance,
  state,
  isStored,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onShowError
}: InstanceCardProps) {
  const statusConfig = STATUS_CONFIG[state.status];

  const parseErrorMessage = (error: string): string => {
    try {
      const parsed = JSON.parse(error);
      return parsed.error?.message || parsed.message || error;
    } catch {
      return error;
    }
  };

  const handleShowError = () => {
    if (state.error && onShowError) {
      const message = parseErrorMessage(state.error);
      onShowError(message);
    }
  };

  return (
    <div
      onClick={onToggleSelect}
      className={`
        p-3 rounded-lg cursor-pointer transition-all duration-200
        bg-surface-low
        ${isSelected 
          ? 'border-2 border-primary' 
          : 'border-2 border-surface-container-high'}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-on-surface truncate">
              {instance.name || instance.id}
            </h3>
            {isStored && (
              <Database className="w-4 h-4 text-green-500 shrink-0" />
            )}
            {!isStored && (
              <Circle className="w-4 h-4 text-surface-container-high shrink-0" />
            )}
          </div>
          <p className="text-xs text-on-surface-variant truncate mt-0.5">
            {instance.provider}
          </p>
          <p className="text-xs text-on-surface-variant/70 truncate">
            {instance.model}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {state.status === 'error' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShowError();
              }}
              className="flex items-center gap-1 text-xs text-error hover:text-error/80 transition-colors bg-error/10 px-2 py-1 rounded"
            >
              连接失败
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
        >
          编辑
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="px-2 py-1 text-xs text-error hover:bg-error/10 rounded transition-colors"
        >
          删除
        </button>
      </div>
    </div>
  );
}
