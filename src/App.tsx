import { useState, useEffect } from 'react'
import { useLLMStore } from './store'
import type { LLMConfig } from './core/types'
import InstanceForm from './components/InstanceForm'
import InstanceCard from './components/InstanceCard'
import MultiChatPanel from './components/MultiChatPanel'
import ErrorModal from './components/ErrorModal'
import { Button } from './components/ui'
import { indexedDBStorage } from './store/indexedDB'

const STORAGE_KEY = 'llm-bridge-storage'

async function saveToIndexedDB(instances: Record<string, LLMConfig>, activeId: string | null) {
  await indexedDBStorage.setItem(STORAGE_KEY, JSON.stringify({
    state: { instances, activeId },
    version: 0
  }))
}

async function loadFromIndexedDB() {
  const data = await indexedDBStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      return JSON.parse(data)
    } catch (e) {
      return null
    }
  }
  return null
}

function App() {
  const { instances, addInstance, removeInstance, updateInstance, testConnection, stream, instanceStates } = useLLMStore()
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [storedIds, setStoredIds] = useState<Set<string>>(new Set())
  const [isTesting, setIsTesting] = useState(false)
  const [editingInstance, setEditingInstance] = useState<LLMConfig | null>(null)
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean
    message: string
    instanceName?: string
  }>({ isOpen: false, message: '' })

  useEffect(() => {
    const init = async () => {
      try {
        const savedData = await loadFromIndexedDB()
        if (savedData?.state?.instances) {
          const storedSet = new Set<string>()
          Object.values(savedData.state.instances).forEach((config: any) => {
            addInstance(config)
            if (config.id) {
              storedSet.add(config.id)
            }
          })
          setStoredIds(storedSet)
        }
      } catch (e) {
        console.error('Failed to load saved data:', e)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const handleCreateInstance = async (config: Partial<LLMConfig>, enableStorage: boolean) => {
    const newConfig = {
      ...config,
      provider: config.provider || 'openai',
      model: config.model || 'gpt-3.5-turbo',
      apiKey: config.apiKey || ''
    } as LLMConfig
    addInstance(newConfig)
    setShowModal(false)
    setEditingInstance(null)
    
    if (enableStorage && newConfig.id) {
      setStoredIds(prev => new Set([...prev, newConfig.id]))
      const allInstances = useLLMStore.getState().instances
      const currentActiveId = useLLMStore.getState().activeId
      await saveToIndexedDB(allInstances, currentActiveId)
    }
  }

  const handleUpdateInstance = async (config: Partial<LLMConfig>, enableStorage: boolean) => {
    if (!editingInstance?.id) return
    
    const updatedConfig = {
      ...editingInstance,
      ...config,
      provider: config.provider || editingInstance.provider,
      model: config.model || editingInstance.model,
      apiKey: config.apiKey ?? editingInstance.apiKey
    } as LLMConfig
    
    updateInstance(editingInstance.id, updatedConfig)
    setShowModal(false)
    setEditingInstance(null)
    
    if (enableStorage) {
      const allInstances = useLLMStore.getState().instances
      const currentActiveId = useLLMStore.getState().activeId
      await saveToIndexedDB(allInstances, currentActiveId)
    }
  }

  const handleEditInstance = (instance: LLMConfig) => {
    setEditingInstance(instance)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingInstance(null)
  }

  const handleShowError = (message: string, instanceName?: string) => {
    setErrorModal({
      isOpen: true,
      message,
      instanceName
    })
  }

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBatchTest = async () => {
    if (selectedIds.size === 0) return
    
    setIsTesting(true)
    try {
      for (const id of selectedIds) {
        await testConnection(id)
      }
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setIsTesting(false)
    }
  }

  const handleRemoveInstance = async (id: string) => {
    const wasStored = storedIds.has(id)
    
    removeInstance(id)
    const newSelected = new Set(selectedIds)
    newSelected.delete(id)
    setSelectedIds(newSelected)
    
    if (wasStored) {
      const newStoredIds = new Set(storedIds)
      newStoredIds.delete(id)
      setStoredIds(newStoredIds)
      
      const allInstances = useLLMStore.getState().instances
      const currentActiveId = useLLMStore.getState().activeId
      await saveToIndexedDB(allInstances, currentActiveId)
    }
  }

  const handleStream = async function* (id: string, prompt: string): AsyncGenerator<string, void, unknown> {
    yield* stream(id, {
      messages: [{ role: 'user', content: prompt }]
    })
  }

  const selectedInstances = Array.from(selectedIds)
    .map(id => instances[id])
    .filter(Boolean)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-dim text-on-surface flex items-center justify-center">
        <div className="text-on-surface-variant">加载中...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-surface-dim">
      <header className="bg-surface-container border-b border-surface-container-high px-6 py-4 shrink-0">
        <h1 className="text-lg font-display font-bold text-on-surface">LLM Bridge</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 bg-surface-container border-r border-surface-container-high flex flex-col shrink-0">
          <div className="p-4 border-b border-surface-container-high">
            <Button onClick={() => setShowModal(true)} className="w-full">
              创建实例
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {Object.keys(instances).length === 0 ? (
              <div className="text-center text-on-surface-variant text-sm py-8">
                暂无实例
              </div>
            ) : (
              <div className="space-y-2">
                {Object.values(instances).map((instance) => {
                  if (!instance.id) return null
                  const state = instanceStates[instance.id] || { status: 'idle' }
                  return (
                    <InstanceCard
                      key={instance.id}
                      instance={instance}
                      state={state}
                      isStored={storedIds.has(instance.id)}
                      isSelected={selectedIds.has(instance.id)}
                      onToggleSelect={() => handleToggleSelect(instance.id)}
                      onEdit={() => handleEditInstance(instance)}
                      onDelete={() => handleRemoveInstance(instance.id)}
                      onShowError={(message) => handleShowError(message, instance.name || instance.id)}
                    />
                  )
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-surface-container-high shrink-0">
            <Button 
              onClick={handleBatchTest} 
              disabled={selectedIds.size === 0 || isTesting}
              loading={isTesting}
              className="w-full"
            >
              {isTesting ? '测试中...' : '测试连通性'}
            </Button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <MultiChatPanel 
            selectedInstances={selectedInstances}
            onStream={handleStream}
          />
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-surface-container rounded-lg shadow-ambient animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-surface-container-high">
              <h2 className="text-xl font-display font-semibold">
                {editingInstance ? '编辑实例' : '创建新实例'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-md hover:bg-surface-container-high transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <InstanceForm 
                instance={editingInstance}
                onSubmit={editingInstance ? handleUpdateInstance : handleCreateInstance} 
                onCancel={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        message={errorModal.message}
        instanceName={errorModal.instanceName}
      />
    </div>
  )
}

export default App
