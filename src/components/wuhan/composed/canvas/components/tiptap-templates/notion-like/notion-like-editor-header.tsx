import { ThemeToggle } from '../../tiptap-templates/notion-like/notion-like-editor-theme-toggle'

// --- Tiptap UI ---
import { UndoRedoButton } from '../../tiptap-ui/undo-redo-button'

// --- UI Primitives ---
import { Spacer } from '../../tiptap-ui-primitive/spacer'
import { Separator } from '../../tiptap-ui-primitive/separator'
import { ButtonGroup } from '../../tiptap-ui-primitive/button'

// --- Styles ---
import './notion-like-editor-header.scss'

import { CollaborationUsers } from './notion-like-editor-collaboration-users'
import { EditorClose } from './notion-like-editor-close'
import { FullscreenButton } from './notion-like-editor-fullscreen'

export function NotionEditorHeader() {
  return (
    <header className="notion-like-editor-header">
      <Spacer />
      <div className="notion-like-editor-header-actions">
        <ButtonGroup orientation="horizontal">
          <UndoRedoButton action="undo" />
          <UndoRedoButton action="redo" />
        </ButtonGroup>

        <Separator />

        <ThemeToggle />

        <Separator />

        <CollaborationUsers />

        <Separator />

        <FullscreenButton />

        <EditorClose />
      </div>
    </header>
  )
}
