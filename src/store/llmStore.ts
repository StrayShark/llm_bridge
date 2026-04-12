import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LLMConfig, GenerateOptions, GenerateResult } from '../core/types';
import { createLLM } from '../core/createLLM';
import { getStorage, type StorageType } from './indexedDB';

type InstanceStatus = 'idle' | 'loading' | 'success' | 'error'

interface LLMStore {
  storageType: StorageType
  instances: Record<string, LLMConfig>
  activeId: string | null
  instanceStates: Record<string, {
    status: InstanceStatus
    lastResponse?: GenerateResult
    error?: string
  }>

  setStorageType: (type: StorageType) => void
  addInstance: (config: LLMConfig) => void
  removeInstance: (id: string) => void
  updateInstance: (id: string, updates: Partial<LLMConfig>) => void
  setActive: (id: string | null) => void

  testConnection: (id: string) => Promise<boolean>
  generate: (id: string, options: GenerateOptions) => Promise<GenerateResult>
  stream: (id: string, options: GenerateOptions) => AsyncGenerator<string, void, unknown>

  getInstance: (id: string) => LLMConfig | undefined
  getAllInstances: () => LLMConfig[]
  getActiveInstance: () => LLMConfig | undefined
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

export const useLLMStore = create<LLMStore>()(
  persist(
    (set, get) => ({
      storageType: 'localStorage' as StorageType,
      instances: {},
      activeId: null,
      instanceStates: {},

      setStorageType: (type: StorageType) => {
        set({ storageType: type });
      },

      addInstance: (config: LLMConfig) => {
        if (!config.id) {
          config.id = crypto.randomUUID();
        }
        set((state) => ({
          instances: { ...state.instances, [config.id]: config },
          activeId: state.activeId || config.id,
          instanceStates: {
            ...state.instanceStates,
            [config.id]: { status: 'idle' }
          }
        }));
      },

      removeInstance: (id: string) => {
        set((state) => {
          const restInstances = Object.fromEntries(
            Object.entries(state.instances).filter(([key]) => key !== id)
          );
          const restStates = Object.fromEntries(
            Object.entries(state.instanceStates).filter(([key]) => key !== id)
          );
          return {
            instances: restInstances,
            instanceStates: restStates,
            activeId: state.activeId === id ? Object.keys(restInstances)[0] || null : state.activeId
          };
        });
      },

      updateInstance: (id: string, updates: Partial<LLMConfig>) => {
        set((state) => {
          if (!state.instances[id]) return state;
          return {
            instances: {
              ...state.instances,
              [id]: { ...state.instances[id], ...updates }
            }
          };
        });
      },

      setActive: (id: string | null) => {
        set({ activeId: id });
      },

      testConnection: async (id: string) => {
        const config = get().instances[id];
        if (!config) throw new Error('Instance not found');

        set((state) => ({
          instanceStates: {
            ...state.instanceStates,
            [id]: { ...state.instanceStates[id], status: 'loading', error: undefined }
          }
        }));

        try {
          const llm = createLLM(config);
          const result = await llm.generate({
            messages: [{ role: 'user', content: 'test' }],
            maxTokens: 5
          });

          set((state) => ({
            instanceStates: {
              ...state.instanceStates,
              [id]: { status: 'success', lastResponse: result }
            }
          }));
          return true;
        } catch (error) {
          set((state) => ({
            instanceStates: {
              ...state.instanceStates,
              [id]: { status: 'error', error: getErrorMessage(error) }
            }
          }));
          return false;
        }
      },

      generate: async (id: string, options: GenerateOptions) => {
        const config = get().instances[id];
        if (!config) throw new Error('Instance not found');

        set((state) => ({
          instanceStates: {
            ...state.instanceStates,
            [id]: { ...state.instanceStates[id], status: 'loading', error: undefined }
          }
        }));

        try {
          const llm = createLLM(config);
          const result = await llm.generate(options);

          set((state) => ({
            instanceStates: {
              ...state.instanceStates,
              [id]: { status: 'success', lastResponse: result }
            }
          }));
          return result;
        } catch (error) {
          set((state) => ({
            instanceStates: {
              ...state.instanceStates,
              [id]: { status: 'error', error: getErrorMessage(error) }
            }
          }));
          throw error;
        }
      },

      stream: async function* (id: string, options: GenerateOptions) {
        const config = get().instances[id];
        if (!config) throw new Error('Instance not found');

        set((state) => ({
          instanceStates: {
            ...state.instanceStates,
            [id]: { ...state.instanceStates[id], status: 'loading', error: undefined }
          }
        }));

        try {
          const llm = createLLM(config);
          let fullContent = '';

          for await (const chunk of llm.stream(options)) {
            fullContent += chunk;
            yield chunk;
          }

          set((state) => ({
            instanceStates: {
              ...state.instanceStates,
              [id]: {
                status: 'success',
                lastResponse: { content: fullContent }
              }
            }
          }));
        } catch (error) {
          set((state) => ({
            instanceStates: {
              ...state.instanceStates,
              [id]: { status: 'error', error: getErrorMessage(error) }
            }
          }));
          throw error;
        }
      },

      getInstance: (id: string) => {
        return get().instances[id];
      },

      getAllInstances: () => {
        return Object.values(get().instances);
      },

      getActiveInstance: () => {
        const { instances, activeId } = get();
        return activeId ? instances[activeId] : undefined;
      }
    }),
    {
      name: 'llm-bridge-storage',
      partialize: (state) => ({
        instances: state.instances,
        activeId: state.activeId
      }),
      storage: getStorage('localStorage') as any
    }
  )
);

export { localStorageStorage, indexedDBStorage, getStorage } from './indexedDB';
export type { StorageType } from './indexedDB';
