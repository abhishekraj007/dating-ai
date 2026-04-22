import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <MessageCircle className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <div>
        <h2 className="font-semibold">Your chats</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a conversation to start chatting
        </p>
      </div>
    </div>
  );
}
