export default function ChatBubble({ sender, text }: { sender: 'user' | 'bot'; text: string }) {
  const isUser = sender === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs px-4 py-2 rounded-2xl text-white ${isUser ? 'bg-blue-400' : 'bg-green-400'}`}>
        {text}
      </div>
    </div>
  );
}
