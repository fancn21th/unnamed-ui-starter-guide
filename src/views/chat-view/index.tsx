import { MessageList } from "./components/MessageList";
import Sender from "./components/Sender";
export function ChatView() {
  return (
    <div className="w-full h-full flex flex-col items-center overflow-hidden">
      <div className="flex-1 w-full overflow-hidden flex flex-col ">
        <MessageList />
        <Sender />
      </div>
    </div>
  );
}
