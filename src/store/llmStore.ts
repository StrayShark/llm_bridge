import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LLMConfig, GenerateOptions, GenerateResult } from '../core/types';
import { createLLM } from '../core/createLLM';
import { getStorage, type StorageType } from './indexedDB';

type InstanceStatus = 'idle' | 'loading' | 'success' | 'error' | 'stopped'

interface LLMStore {
  storageType: StorageType
  instances: Record<string, LLMConfig>
  activeId: string | null
  instanceStates: Record<string, {
    status: InstanceStatus
    lastResponse?: GenerateResult
    error?: string
  }>
  abortControllers: Record<string, AbortController>

  setStorageType: (type: StorageType) => void
  addInstance: (config: LLMConfig) => void
  removeInstance: (id: string) => void
  updateInstance: (id: string, updates: Partial<LLMConfig>) => void
  setActive: (id: string | null) => void

  testConnection: (id: string) => Promise<boolean>
  generate: (id: string, options: GenerateOptions) => Promise<GenerateResult>
  stream: (id: string, options: GenerateOptions) => AsyncGenerator<string, void, unknown>
  stopInstance: (id: string) => void

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
      abortControllers: {},

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
        const controller = get().abortControllers[id];
        if (controller) {
          controller.abort();
        }
        set((state) => {
          const { [id]: _, ...restAbortControllers } = state.abortControllers;
          const restInstances = Object.fromEntries(
            Object.entries(state.instances).filter(([key]) => key !== id)
          );
          const restStates = Object.fromEntries(
            Object.entries(state.instanceStates).filter(([key]) => key !== id)
          );
          return {
            instances: restInstances,
            instanceStates: restStates,
            abortControllers: restAbortControllers,
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

        const controller = new AbortController();
        set((state) => ({
          instanceStates: {
            ...state.instanceStates,
            [id]: { ...state.instanceStates[id], status: 'loading', error: undefined }
          },
          abortControllers: { ...state.abortControllers, [id]: controller }
        }));

        try {
          const llm = createLLM(config);
          await llm.generate({
            messages: [{ role: 'user', content: 'test' }],
            maxTokens: 5
          }, controller.signal);

          set((state) => ({
            instanceStates: {
              ...state.instanceStates,
              [id]: { status: 'success' }
            }
          }));
          return true;
        } catch (error) {
          const isCancelled = error instanceof Error && error.message === 'Request cancelled';
          set((state) => ({
            instanceStates: {
              ...state.instanceStates,
              [id]: { status: isCancelled ? 'stopped' : 'error', error: isCancelled ? '已取消' : getErrorMessage(error) }
            }
          }));
          return false;
        } finally {
          set((state) => {
            const { [id]: _, ...rest } = state.abortControllers;
            return { abortControllers: rest };
          });
        }
      },

      generate: async (id: string, options: GenerateOptions) => {
        const config = get().instances[id];
        if (!config) throw new Error('Instance not found');

        const controller = new AbortController();
        set((state) => ({
          instanceStates: {
            ...state.instanceStates,
            [id]: { ...state.instanceStates[id], status: 'loading', error: undefined }
          },
          abortControllers: { ...state.abortControllers, [id]: controller }
        }));

        try {
          const llm = createLLM(config);
          const result = await llm.generate(options, controller.signal);

          set((state) => ({
            instanceStates: {
              ...state.instanceStates,
              [id]: { status: 'success', lastResponse: result }
            }
          }));
          return result;
        } catch (error) {
          const isCancelled = error instanceof Error && error.message === 'Request cancelled';
          set((state) => ({
            instanceStates: {
              ...state.instanceStates,
              [id]: { status: isCancelled ? 'stopped' : 'error', error: isCancelled ? '已取消' : getErrorMessage(error) }
            }
          }));
          throw error;
        } finally {
          set((state) => {
            const { [id]: _, ...rest } = state.abortControllers;
            return { abortControllers: rest };
          });
        }
      },

      stream: async function* (id: string, options: GenerateOptions) {
        const config = get().instances[id];
        if (!config) throw new Error('Instance not found');

        const controller = new AbortController();
        let accumulatedContent = '';

        set((state) => ({
          instanceStates: {
            ...state.instanceStates,
            [id]: { ...state.instanceStates[id], status: 'loading', error: undefined }
          },
          abortControllers: { ...state.abortControllers, [id]: controller }
        }));

        try {
          const llm = createLLM(config);

          for await (const chunk of llm.stream(options, controller.signal)) {
            accumulatedContent += chunk;
            yield chunk;
          }

          set((state) => ({
            instanceStates: {
              ...state.instanceStates,
              [id]: {
                status: 'success',
                lastResponse: { content: accumulatedContent }
              }
            }
          }));
        } catch (error) {
          const isCancelled = error instanceof Error && error.message === 'Request cancelled';
          set((state) => ({
            instanceStates: {
              ...state.instanceStates,
              [id]: {
                status: isCancelled ? 'stopped' : 'error',
                error: isCancelled ? '已取消' : getErrorMessage(error),
                lastResponse: { content: accumulatedContent }
              }
            }
          }));
          throw error;
        } finally {
          set((state) => {
            const { [id]: _, ...rest } = state.abortControllers;
            return { abortControllers: rest };
          });
        }
      },

      stopInstance: (id: string) => {
        const controller = get().abortControllers[id];
        if (controller) {
          controller.abort();
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
