
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [model, setModel] = useState('deepseek-ai/DeepSeek-V3-0324')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const modelOptions = {
    'Deepseek V3 0324': 'deepseek-ai/DeepSeek-V3-0324',
    'Deepseek R1 0528': 'deepseek-ai/DeepSeek-R1-0528',
    'Qwen3 235B A22B': 'Qwen/Qwen3-235B-A22B',
    'Qwen3 32B': 'Qwen/Qwen3-32B',
    'Llama 4 Scout': 'chutesai/Llama-4-Scout-17B-16E-Instruct',
    'Mistral Small 3.1': 'chutesai/Mistral-Small-3.1-24B-Instruct-2503'
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    const userMsg = { sender: 'user', text: userMessage }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    try {
      const response = await fetch('/api/chutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: userMessage }]
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const reply = data.reply || 'エラーが発生しました'
      setMessages((prev) => [...prev, { sender: 'ai', text: reply }])
    } catch (error) {
      console.error('API Error:', error)
      setMessages((prev) => [...prev, { sender: 'ai', text: 'API通信エラーが発生しました' }])
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head>
        <title>にゃんぷっぷー</title>
      </Head>

      <header className="bg-green-500 text-white p-4 font-bold text-lg">にゃんぷっぷー</header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-xl px-4 py-2 max-w-xs ${
                msg.sender === 'user'
                  ? 'bg-green-400 text-white rounded-br-none'
                  : 'bg-white text-black border rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white flex items-center border-t">
        <select
          className="mr-2 px-2 py-1 border rounded text-sm"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {Object.entries(modelOptions).map(([label, value]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="flex-1 px-4 py-2 border rounded mr-2"
          placeholder="メッセージを入力"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-green-500 text-white px-4 py-2 rounded font-bold"
        >
          送信
        </button>
      </div>
    </div>
  )
}
