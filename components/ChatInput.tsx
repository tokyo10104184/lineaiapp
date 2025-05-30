import { useState } from 'react';

export default function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white flex">
      <input
        className="flex-1 border rounded-lg px-4 py-2 mr-2"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="にゃんぷっぷーに話しかけよう"
      />
      <button type="submit" className="bg-pink-400 text-white rounded-lg px-4 py-2">送信</button>
    </form>
  );
}
