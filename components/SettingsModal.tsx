import React from 'react';
import { FaTimes } from 'react-icons/fa';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  provider?: 'openrouter' | 'gemini' | 'groq' | 'cloudflare';
  setProvider?: (provider: 'openrouter' | 'gemini' | 'groq' | 'cloudflare') => void;
  geminiApiKey?: string;
  setGeminiApiKey?: (key: string) => void;
  groqApiKey?: string;
  setGroqApiKey?: (key: string) => void;
  cloudflareApiKey?: string;
  setCloudflareApiKey?: (key: string) => void;
  cloudflareAccountId?: string;
  setCloudflareAccountId?: (id: string) => void;
  model: string;
  setModel: (model: string) => void;
  temperature: number;
  setTemperature: (temperature: number) => void;
  useCensorship: boolean;
  setUseCensorship: (useCensorship: boolean) => void;
  streamResponse?: boolean;
  setStreamResponse?: (streamResponse: boolean) => void;
  lineThemeActive: boolean;
  setLineThemeActive: (lineThemeActive: boolean) => void;
  allowAICustomTextColor: boolean;
  setAllowAICustomTextColor: (allowAICustomTextColor: boolean) => void;
  chatFontSize: string;
  setChatFontSize: (chatFontSize: string) => void;
  modelOptions?: any;
}

const SettingSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-indigo-400 mb-3">{title}</h3>
    <div className="space-y-5 pl-2">{children}</div>
  </div>
);

const ToggleSwitch: React.FC<{ label: string; description: string; enabled: boolean; onToggle: () => void; }> = ({ label, description, enabled, onToggle }) => (
  <div className="flex items-center justify-between">
    <div>
      <label className="text-sm font-medium">{label}</label>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </div>
    <div
      onClick={onToggle}
      className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors duration-300 ease-in-out ${
        enabled ? 'bg-indigo-500' : 'bg-slate-400 dark:bg-slate-600'
      }`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ease-in-out duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </div>
  </div>
);

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  provider = 'openrouter',
  setProvider,
  geminiApiKey = '',
  setGeminiApiKey,
  groqApiKey = '',
  setGroqApiKey,
  cloudflareApiKey = '',
  setCloudflareApiKey,
  cloudflareAccountId = '',
  setCloudflareAccountId,
  model,
  setModel,
  temperature,
  setTemperature,
  useCensorship,
  setUseCensorship,
  streamResponse = true,
  setStreamResponse,
  lineThemeActive,
  setLineThemeActive,
  allowAICustomTextColor,
  setAllowAICustomTextColor,
  chatFontSize,
  setChatFontSize,
}) => {

  if (!isOpen) return null;

  const panelBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-700';
  const inputBgColor = isDarkMode ? 'bg-slate-700' : 'bg-slate-100';
  const borderColor = isDarkMode ? 'border-slate-600' : 'border-slate-300';


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${panelBgColor} ${textColor} p-6 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">設定</h2>
          <button onClick={onClose} className={`p-1.5 rounded-full hover:${isDarkMode?'bg-slate-700/70':'bg-slate-200/70'} transition-colors`}>
            <FaTimes size={22} />
          </button>
        </div>
        <div className="space-y-8 overflow-y-auto custom-scrollbar pr-3 pb-2">
          <SettingSection title="AI設定">
            <div>
              <label className="block text-sm font-medium mb-1.5">APIプロバイダー</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    if (setProvider) setProvider('openrouter');
                  }}
                  className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                    provider === 'openrouter'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : `${inputBgColor} ${textColor} ${borderColor}`
                  }`}
                >
                  OpenRouter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (setProvider) setProvider('gemini');
                  }}
                  className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                    provider === 'gemini'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : `${inputBgColor} ${textColor} ${borderColor}`
                  }`}
                >
                  Gemini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (setProvider) setProvider('groq');
                  }}
                  className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                    provider === 'groq'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : `${inputBgColor} ${textColor} ${borderColor}`
                  }`}
                >
                  Groq
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (setProvider) setProvider('cloudflare');
                  }}
                  className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${
                    provider === 'cloudflare'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : `${inputBgColor} ${textColor} ${borderColor}`
                  }`}
                >
                  Cloudflare
                </button>
              </div>
            </div>
            {provider === 'gemini' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Gemini APIキー</label>
                <input
                  type="password"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm shadow-sm ${inputBgColor} ${textColor} ${borderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey && setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                />
                <div className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Google AI Studioで取得したGemini APIキーを入力してください。ブラウザに保存されます。
                </div>
              </div>
            )}
            {provider === 'groq' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Groq APIキー</label>
                <input
                  type="password"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm shadow-sm ${inputBgColor} ${textColor} ${borderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey && setGroqApiKey(e.target.value)}
                  placeholder="gsk_..."
                />
                <div className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Groq Console (console.groq.com) で取得したAPIキーを入力してください。ブラウザに保存されます。
                </div>
              </div>
            )}
            {provider === 'cloudflare' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Cloudflare APIトークン</label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm shadow-sm ${inputBgColor} ${textColor} ${borderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    value={cloudflareApiKey}
                    onChange={(e) => setCloudflareApiKey && setCloudflareApiKey(e.target.value)}
                    placeholder="APIトークンを入力..."
                  />
                  <div className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Cloudflareダッシュボードで発行したWorkers AIアクセス用APIトークンを入力してください。
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Cloudflare Account ID</label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm shadow-sm ${inputBgColor} ${textColor} ${borderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    value={cloudflareAccountId}
                    onChange={(e) => setCloudflareAccountId && setCloudflareAccountId(e.target.value)}
                    placeholder="アカウントID (32桁の16進数)"
                  />
                  <div className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    CloudflareダッシュボードのURLまたは右サイドバーにあるAccount IDを入力してください。
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className={`block text-sm font-medium mb-1.5`}>AIモデル</label>
              <input
                type="text"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm shadow-sm ${inputBgColor} ${textColor} ${borderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={
                  provider === 'gemini'
                    ? "例: gemini-2.5-flash"
                    : provider === 'groq'
                    ? "例: llama-3.3-70b-versatile"
                    : provider === 'cloudflare'
                    ? "例: @cf/meta/llama-3.1-8b-instruct"
                    : "例: xiaomi/mimo-v2-flash:free"
                }
              />
              <div className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {provider === 'gemini'
                  ? 'Geminiのモデル名を入力してください (例: gemini-2.5-flash, gemini-1.5-flash)'
                  : provider === 'groq'
                  ? 'Groqのモデル名を入力してください (例: llama-3.3-70b-versatile, llama-3.1-8b-instant)'
                  : provider === 'cloudflare'
                  ? 'Cloudflare Workers AIのモデル名を入力してください (例: @cf/meta/llama-3.1-8b-instruct)'
                  : 'OpenRouterなどのモデルIDを直接入力してください。'}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-sm font-medium`}>Temperature (創造性)</label>
                  <span className="text-sm font-mono text-indigo-400">{temperature.toFixed(1)}</span>
              </div>
              <input type="range" min="0.1" max="1.5" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? 'bg-slate-700 accent-indigo-500' : 'bg-slate-200 accent-indigo-500'}`} />
            </div>
            <ToggleSwitch
              label="検閲を使用"
              description="AIの応答に検閲を適用します。"
              enabled={useCensorship}
              onToggle={() => setUseCensorship(!useCensorship)}
            />
            <ToggleSwitch
              label="ストリーミング応答"
              description="AIの返答をリアルタイムに流し込み表示します。"
              enabled={streamResponse}
              onToggle={() => setStreamResponse && setStreamResponse(!streamResponse)}
            />
          </SettingSection>

          <SettingSection title="表示設定">
            <ToggleSwitch
                label="LINE風テーマ"
                description="チャット画面をLINEのようなデザインに変更します。"
                enabled={lineThemeActive}
                onToggle={() => setLineThemeActive(!lineThemeActive)}
              />
            <ToggleSwitch
              label="AIによる文字色指定を許可"
              description="AIが応答にC(red)[テキスト]Cのような形式で色を指定できるようにします。"
              enabled={allowAICustomTextColor}
              onToggle={() => setAllowAICustomTextColor(!allowAICustomTextColor)}
            />
            <div>
              <label className={`block text-sm font-medium mb-1.5`}>チャットフォントサイズ</label>
              <select
                className={`w-full px-3 py-2.5 border rounded-lg text-sm shadow-sm ${inputBgColor} ${textColor} ${borderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                value={chatFontSize}
                onChange={(e) => setChatFontSize(e.target.value)}
              >
                <option value="text-xs">極小</option>
                <option value="text-sm">小</option>
                <option value="text-base">標準</option>
                <option value="text-lg">大</option>
              </select>
            </div>
          </SettingSection>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={onClose} className={`w-full px-6 py-2.5 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-150 shadow-md`}>
                閉じる
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
