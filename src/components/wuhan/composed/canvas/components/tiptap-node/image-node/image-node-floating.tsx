import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "../../../hooks/use-tiptap-editor"

// --- Lib ---
import { isNodeTypeSelected } from "../../../lib/tiptap-utils"

// --- Tiptap UI ---
import { DeleteNodeButton } from "../../tiptap-ui/delete-node-button"
import { ImageDownloadButton } from "../../tiptap-ui/image-download-button"
import { ImageAlignButton } from "../../tiptap-ui/image-align-button"

// --- UI Primitive ---
import { Separator } from "../../tiptap-ui-primitive/separator"
import { ImageCaptionButton } from "../../tiptap-ui/image-caption-button"
import { ImageUploadButton } from "../../tiptap-ui/image-upload-button"
import { RefreshCcwIcon } from "../../tiptap-icons/refresh-ccw-icon"

export function ImageNodeFloating({
  editor: providedEditor,
}: {
  editor?: Editor | null
}) {
  const { editor } = useTiptapEditor(providedEditor)
  const visible = isNodeTypeSelected(editor, ["image"])

  if (!editor || !visible) {
    return null
  }

  return (
    <>
      <ImageAlignButton align="left" />
      <ImageAlignButton align="center" />
      <ImageAlignButton align="right" />
      <Separator />
      <ImageCaptionButton />
      <Separator />
      <ImageDownloadButton />
      <ImageUploadButton icon={RefreshCcwIcon} tooltip="Replace" />
      <Separator />
      <DeleteNodeButton />
    </>
  )
}
