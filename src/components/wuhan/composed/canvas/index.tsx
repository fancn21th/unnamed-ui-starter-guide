import {NotionEditor} from "./components/tiptap-templates/notion-like/notion-like-editor";
import './index.css'

const Canvas = () => {
    return (
        <div
            style={{minHeight: "100vh", display: "flex", flexDirection: "column"}}
        >
            <NotionEditor room="my-document-room" placeholder="Start writing..."/>
        </div>
    );
}

export default Canvas;