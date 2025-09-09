import React from 'react';
import { FaTimes } from 'react-icons/fa';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  model: string;
  setModel: (model: string) => void;
  temperature: number;
  setTemperature: (temperature: number) => void;
  useCensorship: boolean;
  setUseCensorship: (useCensorship: boolean) => void;
  lineThemeActive: boolean;
  setLineThemeActive: (lineThemeActive: boolean) => void;
  allowAICustomTextColor: boolean;
  setAllowAICustomTextColor: (allowAICustomTextColor: boolean) => void;
  chatFontSize: string;
  setChatFontSize: (chatFontSize: string) => void;
  backgroundColor: string;
  setBackgroundColor: (backgroundColor: string) => void;
  lightModeBackgrounds: any;
  darkModeBackgrounds: any;
  modelOptions: any;
  cheatMode: boolean;
  setCheatMode: (value: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  model,
  setModel,
  temperature,
  setTemperature,
  useCensorship,
  setUseCensorship,
  lineThemeActive,
  setLineThemeActive,
  allowAICustomTextColor,
  setAllowAICustomTextColor,
  chatFontSize,
  setChatFontSize,
  backgroundColor,
  setBackgroundColor,
  lightModeBackgrounds,
  darkModeBackgrounds,
  modelOptions,
  cheatMode,
  setCheatMode,
}) => {
  if (!isOpen) return null;

  const panelBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-700';
  const inputBgColor = isDarkMode ? 'bg-slate-700' : 'bg-slate-100';
  const borderColor = isDarkMode ? 'border-slate-600' : 'border-slate-300';
  const activeChatBackgroundPalette = isDarkMode ? darkModeBackgrounds : lightModeBackgrounds;

  const SettingSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
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
              <label className={`block text-sm font-medium mb-1.5`}>AIモデル</label>
              <select className={`w-full px-3 py-2.5 border rounded-lg text-sm shadow-sm ${inputBgColor} ${textColor} ${borderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`} value={model} onChange={(e) => setModel(e.target.value)}>
                {Object.entries(modelOptions).map(([label, info]: [string, any]) => ( <option key={info.value} value={info.value}> {label} </option> ))}
              </select>
              <div className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}> {Object.entries(modelOptions).find(([_, info]: [string, any]) => info.value === model)?.[1]?.description} </div>
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
              label="チートモード"
              description="オフにするとゲージの手動編集が可能になります。"
              enabled={cheatMode}
              onToggle={() => setCheatMode(!cheatMode)}
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
             <div>
              <label className={`block text-sm font-medium mb-1.5`}>チャット背景色</label>
              <select
                className={`w-full px-3 py-2.5 border rounded-lg text-sm shadow-sm ${inputBgColor} ${textColor} ${borderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${lineThemeActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                disabled={lineThemeActive} >
                {Object.keys(activeChatBackgroundPalette).map((colorName) => ( <option key={colorName} value={colorName}> {colorName} </option> ))}
              </select>
              {lineThemeActive && <p className={`text-xs mt-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>LINE風テーマ有効時は固定されます。</p>}
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
