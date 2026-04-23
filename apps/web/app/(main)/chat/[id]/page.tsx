import { ChatView } from "@/components/chat/chat-view";

interface ChatConversationPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatConversationPage({
  params,
}: ChatConversationPageProps) {
  const { id } = await params;
  return <ChatView conversationId={id} />;
}
