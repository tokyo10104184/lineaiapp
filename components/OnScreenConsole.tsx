import React, { useState, useEffect, useCallback } from 'react';

interface ConsoleMessage {
  type: 'log' | 'error' | 'warn';
  message: string;
  count: number;
}

const OnScreenConsole: React.FC = () => {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  const formatMessage = (args: any[]): string => {
    return args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.stack || arg.message;
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }).join(' ');
  };

  const addMessage = useCallback((newMessage: ConsoleMessage) => {
    setMessages(prevMessages => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      if (lastMessage && lastMessage.message === newMessage.message && lastMessage.type === newMessage.type) {
        return [...prevMessages.slice(0, -1), { ...lastMessage, count: lastMessage.count + 1 }];
      }
      return [...prevMessages, newMessage];
    });
  }, []);

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      addMessage({ type: 'log', message: formatMessage(args), count: 1 });
      originalLog.apply(console, args);
    };

    console.error = (...args: any[]) => {
      addMessage({ type: 'error', message: formatMessage(args), count: 1 });
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
        addMessage({ type: 'warn', message: formatMessage(args), count: 1 });
        originalWarn.apply(console, args);
    };

    // Cleanup function to restore original console functions
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [addMessage]);

  if (!isOpen) {
    return (
        <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 bg-red-600 text-white p-2 rounded-full shadow-lg z-50 text-xs"
        >
            DEBUG
        </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[calc(100%-2rem)] max-w-lg h-60 bg-black/80 text-white font-mono text-xs rounded-lg shadow-2xl z-50 flex flex-col p-2 backdrop-blur-sm">
      <div className="flex justify-between items-center pb-1 border-b border-gray-600 mb-1">
        <h3 className="font-bold">On-Screen Console</h3>
        <div>
            <button onClick={() => setMessages([])} className="px-2 py-0.5 mr-2 text-gray-300 hover:bg-gray-700 rounded">Clear</button>
            <button onClick={() => setIsOpen(false)} className="px-2 py-0.5 text-gray-300 hover:bg-gray-700 rounded">Hide</button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        {messages.map((msg, index) => (
          <div key={index} className={`py-0.5 px-1 border-b border-gray-800/50 flex ${msg.type === 'error' ? 'text-red-400' : msg.type === 'warn' ? 'text-yellow-400' : 'text-gray-200'}`}>
            <pre className="whitespace-pre-wrap break-words flex-grow">{msg.message}</pre>
            {msg.count > 1 && <span className="ml-2 bg-gray-600 text-white text-[10px] rounded-full px-2 py-0.5 flex-shrink-0">{msg.count}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnScreenConsole;
