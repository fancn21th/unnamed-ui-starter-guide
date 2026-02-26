// --- UI Primitives ---
import { Button } from '../../tiptap-ui-primitive/button/button.tsx'

// --- Icons ---
import { Maximize2 } from 'lucide-react'
import { useAppState } from '@/contexts/app-context.lib.ts'

export function FullscreenButton() {
  const { setCanvasFullScreen } = useAppState()
  const toggleFullscreen = () => {
    setCanvasFullScreen(true)
  }

  return (
    <Button
      onClick={toggleFullscreen}
      data-style="ghost"
      tooltip="Toggle fullscreen"
      showTooltip={true}
    >
      <Maximize2 className="tiptap-button-icon" />
    </Button>
  )
}
