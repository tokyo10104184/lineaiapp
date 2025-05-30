
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

export default function Home() {
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [model, setModel] = useState('deepseek-ai/DeepSeek-V3-0324')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [personality, setPersonality] = useState('フレンドリーで親しみやすい')
  const [temperature, setTemperature] = useState(0.7)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const modelOptions = {
    'Deepseek V3 0324': {
      value: 'deepseek-ai/DeepSeek-V3-0324',
      description: '高性能・長文・高速の万能モデル'
    },
    'Deepseek R1 0528': {
      value: 'deepseek-ai/DeepSeek-R1-0528',
      description: '深い推論力を備えたモデル'
    },
    'Qwen3 235B A22B': {
      value: 'Qwen/Qwen3-235B-A22B',
      description: '推論力に長けた高速モデル'
    },
    'Qwen3 32B': {
      value: 'Qwen/Qwen3-32B',
      description: '使いやすい小型推論モデル'
    },
    'Llama 4 Scout': {
      value: 'chutesai/Llama-4-Scout-17B-16E-Instruct',
      description: 'バランス型のMeta製モデル'
    },
    'Mistral Small 3.1': {
      value: 'chutesai/Mistral-Small-3.1-24B-Instruct-2503',
      description: '軽量・高速な省リソースモデル'
    }
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
      const systemPrompt = `あなたは${personality}なAIアシスタントです。推論プロセスや思考過程は表示せず、最終的な回答のみを提供してください。`
      
      const response = await fetch('/api/chutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      let reply = data.reply || 'エラーが発生しました'
      
      // 推論プロセスを隠す処理
      if (reply.includes('<think>')) {
        const thinkStart = reply.indexOf('<think>')
        const thinkEnd = reply.indexOf('</think>') + 8
        if (thinkStart !== -1 && thinkEnd !== -1) {
          reply = reply.substring(0, thinkStart) + reply.substring(thinkEnd)
        }
      }
      
      // 他の推論マーカーも除去
      reply = reply.replace(/\*\*思考過程\*\*[\s\S]*?\*\*回答\*\*/g, '')
      reply = reply.replace(/\*\*推論\*\*[\s\S]*?\*\*結論\*\*/g, '')
      reply = reply.replace(/【思考】[\s\S]*?【回答】/g, '')
      
      setMessages((prev) => [...prev, { sender: 'ai', text: reply.trim() }])
    } catch (error) {
      console.error('API Error:', error)
      setMessages((prev) => [...prev, { sender: 'ai', text: 'API通信エラーが発生しました' }])
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Head>
        <title>にゃんぷっぷー</title>
      </Head>

      {/* サイドバー */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r overflow-hidden`}>
        <div className="p-4 space-y-4">
          <h3 className="font-bold text-lg">設定</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">AIモデル</label>
            <select
              className="w-full px-3 py-2 border rounded"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {Object.entries(modelOptions).map(([label, info]) => (
                <option key={info.value} value={info.value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">
              {Object.entries(modelOptions).find(([_, info]) => info.value === model)?.[1].description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">AIの性格</label>
            <select
              className="w-full px-3 py-2 border rounded"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
            >
              <option value="フレンドリーで親しみやすい">フレンドリー</option>
              <option value="丁寧で礼儀正しい">丁寧・礼儀正しい</option>
              <option value="カジュアルで親近感のある">カジュアル</option>
              <option value="知的で論理的な">知的・論理的</option>
              <option value="創造的で想像力豊かな">創造的</option>
              <option value="専門的で詳細な">専門的</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">創造性 ({temperature})</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>保守的</span>
              <span>創造的</span>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col">
        <header className="bg-green-500 text-white p-4 font-bold text-lg flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mr-3 p-1 hover:bg-green-600 rounded"
          >
            ☰
          </button>
          にゃんぷっぷー
        </header>

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
    </div>
  )
}
