import { createContext, useContext } from 'react'
export type AppContextValue = {
  showCanvas: boolean
  canvasFullScreen: boolean
  setShowCanvas: (show: boolean) => void
  setCanvasFullScreen: (fullScreen: boolean) => void
}
const AppContext = createContext<AppContextValue | null>(null)

export const AppContextProvider = AppContext.Provider

/**
 * Hook to access the app state.
 * @returns {AppContextValue}
 */
export const useAppState = (): AppContextValue => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider')
  }
  return context
}
