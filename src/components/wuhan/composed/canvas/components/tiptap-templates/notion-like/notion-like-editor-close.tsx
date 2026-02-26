// --- UI Primitives ---
import { Button } from '../../tiptap-ui-primitive/button/button.tsx'

// --- Icons ---
import { CloseIcon } from '../../tiptap-icons/close-icon'
import { useAppState } from '@/contexts/app-context.lib'

export function EditorClose() {
  const { setShowCanvas, canvasFullScreen, setCanvasFullScreen } = useAppState()

  const onClose = () => {
    if (canvasFullScreen) {
      setCanvasFullScreen(false)
    } else {
      setShowCanvas(false)
    }
  }

  return (
    <Button onClick={onClose} data-style="ghost">
      <CloseIcon className="tiptap-button-icon" />
    </Button>
  )
}
