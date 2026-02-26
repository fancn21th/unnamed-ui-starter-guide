import { type ReactNode, useMemo, useState } from 'react'
import { AppContextProvider } from './app-context.lib'
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [showCanvas, setShowCanvas] = useState<boolean>(false)
  const [canvasFullScreen, setCanvasFullScreen] = useState<boolean>(false)
  const providerValue = useMemo(
    () => ({
      showCanvas,
      setShowCanvas,
      canvasFullScreen,
      setCanvasFullScreen,
    }),
    [showCanvas, setShowCanvas, canvasFullScreen, setCanvasFullScreen]
  )
  return (
    <AppContextProvider value={providerValue}>{children}</AppContextProvider>
  )
}
