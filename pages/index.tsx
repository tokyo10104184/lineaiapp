
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

interface Message {
  sender: 'user' | 'ai'
  text: string
  timestamp: Date
}

interface Character {
  id: string
  name: string
  personality: string
  systemPrompt: string
  color: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  characterId: string
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string>('')
  const [input, setInput] = useState('')
  const [model, setModel] = useState('deepseek-ai/DeepSeek-V3-0324')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [temperature, setTemperature] = useState(0.7)
  const [backgroundColor, setBackgroundColor] = useState('#f3f4f6')
  const [characters, setCharacters] = useState<Character[]>([])
  const [currentCharacterId, setCurrentCharacterId] = useState<string>('')
  const [showCharacterDialog, setShowCharacterDialog] = useState(false)
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    personality: '',
    systemPrompt: '',
    color: '#10b981'
  })
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

  // 初期化
  useEffect(() => {
    const savedData = localStorage.getItem('chatAppData')
    if (savedData) {
      const data = JSON.parse(savedData)
      setConversations(data.conversations || [])
      setCharacters(data.characters || [])
      setCurrentConversationId(data.currentConversationId || '')
      setCurrentCharacterId(data.currentCharacterId || '')
      setBackgroundColor(data.backgroundColor || '#f3f4f6')
    }
    
    // デフォルトキャラクター作成
    if (characters.length === 0) {
      const defaultChar: Character = {
        id: '1',
        name: 'にゃんぷっぷー',
        personality: 'フレンドリーで親しみやすい',
        systemPrompt: 'あなたはフレンドリーで親しみやすいAIアシスタントです。推論プロセスや思考過程は表示せず、最終的な回答のみを提供してください。',
        color: '#10b981'
      }
      setCharacters([defaultChar])
      setCurrentCharacterId('1')
    }
  }, [])

  // データ保存
  useEffect(() => {
    const data = {
      conversations,
      characters,
      currentConversationId,
      currentCharacterId,
      backgroundColor
    }
    localStorage.setItem('chatAppData', JSON.stringify(data))
  }, [conversations, characters, currentConversationId, currentCharacterId, backgroundColor])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [conversations])

  const currentConversation = conversations.find(c => c.id === currentConversationId)
  const currentCharacter = characters.find(c => c.id === currentCharacterId)

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: `新しい会話 ${conversations.length + 1}`,
      messages: [],
      characterId: currentCharacterId
    }
    setConversations(prev => [...prev, newConv])
    setCurrentConversationId(newConv.id)
  }

  const addCharacter = () => {
    if (!newCharacter.name.trim()) return
    
    const character: Character = {
      id: Date.now().toString(),
      ...newCharacter
    }
    setCharacters(prev => [...prev, character])
    setCurrentCharacterId(character.id)
    setNewCharacter({
      name: '',
      personality: '',
      systemPrompt: '',
      color: '#10b981'
    })
    setShowCharacterDialog(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || !currentConversation || !currentCharacter) return

    const userMessage = input.trim()
    const newMessage: Message = { 
      sender: 'user', 
      text: userMessage, 
      timestamp: new Date() 
    }
    
    setConversations(prev => prev.map(conv => 
      conv.id === currentConversationId 
        ? { ...conv, messages: [...conv.messages, newMessage] }
        : conv
    ))
    setInput('')

    try {
      const response = await fetch('/api/chutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: currentCharacter.systemPrompt },
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
      
      reply = reply.replace(/\*\*思考過程\*\*[\s\S]*?\*\*回答\*\*/g, '')
      reply = reply.replace(/\*\*推論\*\*[\s\S]*?\*\*結論\*\*/g, '')
      reply = reply.replace(/【思考】[\s\S]*?【回答】/g, '')
      
      const aiMessage: Message = { 
        sender: 'ai', 
        text: reply.trim(), 
        timestamp: new Date() 
      }
      
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId 
          ? { ...conv, messages: [...conv.messages, aiMessage] }
          : conv
      ))
    } catch (error) {
      console.error('API Error:', error)
      const errorMessage: Message = { 
        sender: 'ai', 
        text: 'API通信エラーが発生しました', 
        timestamp: new Date() 
      }
      setConversations(prev => prev.map(conv => 
        conv.id === currentConversationId 
          ? { ...conv, messages: [...conv.messages, errorMessage] }
          : conv
      ))
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="h-screen bg-gray-100 flex" style={{ backgroundColor }}>
      <Head>
        <title>にゃんぷっぷー</title>
      </Head>

      {/* サイドバー */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r overflow-hidden flex flex-col`}>
        <div className="p-4 border-b">
          <h3 className="font-bold text-lg mb-2">会話</h3>
          <button
            onClick={createNewConversation}
            className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm mb-2"
          >
            新しい会話
          </button>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setCurrentConversationId(conv.id)}
                className={`p-2 text-sm rounded cursor-pointer ${
                  conv.id === currentConversationId ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
              >
                {conv.title}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-b">
          <h3 className="font-bold text-lg mb-2">キャラクター</h3>
          <button
            onClick={() => setShowCharacterDialog(true)}
            className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm mb-2"
          >
            新しいキャラクター
          </button>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {characters.map(char => (
              <div
                key={char.id}
                onClick={() => setCurrentCharacterId(char.id)}
                className={`p-2 text-sm rounded cursor-pointer flex items-center ${
                  char.id === currentCharacterId ? 'bg-green-100' : 'hover:bg-gray-100'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: char.color }}
                />
                {char.name}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-2">AIモデル</label>
            <select
              className="w-full px-3 py-2 border rounded text-sm"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {Object.entries(modelOptions).map(([label, info]) => (
                <option key={info.value} value={info.value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">背景色</label>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-full h-8 border rounded"
            />
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
          {currentCharacter ? currentCharacter.name : 'にゃんぷっぷー'}
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
          {currentConversation?.messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col">
                <div
                  className={`rounded-xl px-4 py-2 max-w-xs ${
                    msg.sender === 'user'
                      ? 'bg-green-400 text-white rounded-br-none'
                      : 'bg-white text-black border rounded-bl-none'
                  }`}
                  style={msg.sender === 'ai' && currentCharacter ? 
                    { borderColor: currentCharacter.color } : {}}
                >
                  {msg.text}
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${
                  msg.sender === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {formatTime(msg.timestamp)}
                </div>
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

      {/* キャラクター作成ダイアログ */}
      {showCharacterDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-96 overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">新しいキャラクター</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">名前</label>
                <input
                  type="text"
                  value={newCharacter.name}
                  onChange={(e) => setNewCharacter(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">性格</label>
                <input
                  type="text"
                  value={newCharacter.personality}
                  onChange={(e) => setNewCharacter(prev => ({ ...prev, personality: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="例: フレンドリーで親しみやすい"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">システムプロンプト</label>
                <textarea
                  value={newCharacter.systemPrompt}
                  onChange={(e) => setNewCharacter(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  className="w-full px-3 py-2 border rounded h-20"
                  placeholder="AIの詳細な指示を入力"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">テーマカラー</label>
                <input
                  type="color"
                  value={newCharacter.color}
                  onChange={(e) => setNewCharacter(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-8 border rounded"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-6">
              <button
                onClick={addCharacter}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded"
              >
                作成
              </button>
              <button
                onClick={() => setShowCharacterDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
