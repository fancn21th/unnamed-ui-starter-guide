import { MessageList } from "./components/MessageList";
import Sender from "./components/Sender";
import { ChatProvider } from "@/lib/chat";

export function ChatView() {
  return (
    <ChatProvider>
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-hidden">
            <MessageList />
          </div>
          <div className="shrink-0 w-full pr-[15px]">
            <Sender />
          </div>
        </div>
      </div>
    </ChatProvider>
  );
}
