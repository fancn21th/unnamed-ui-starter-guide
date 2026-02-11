import { MessageList } from "./components/MessageList";
import Sender from "./components/Sender";
export function ChatView() {
  return (
    <div className="w-full h-full flex flex-col items-center overflow-hidden">
      <div className="max-w-[800px] flex-1 overflow-auto flex flex-col">
        <MessageList />
        <Sender />
      </div>
    </div>
  );
}
