import { FaPen, FaRobot } from 'react-icons/fa';
import { Character } from '../lib/types';

interface NewCharacterChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManualCreate: () => void;
  onQuickCreate: () => void;
  isDarkMode: boolean;
  baseCharacter?: Character | null;
}

const NewCharacterChoiceModal = ({
  isOpen,
  onClose,
  onManualCreate,
  onQuickCreate,
  isDarkMode,
  baseCharacter,
}: NewCharacterChoiceModalProps) => {
  if (!isOpen) return null;

  const generalPanelBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const generalTextColor = isDarkMode ? 'text-slate-200' : 'text-slate-700';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${generalPanelBgColor} ${generalTextColor} p-6 rounded-xl shadow-2xl w-[95vw] sm:max-w-md`}>
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold">
            {baseCharacter ? `「${baseCharacter.name}」をリミックス` : '新しいキャラクターを作成'}
          </h3>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {baseCharacter
                ? 'このキャラクターをベースにして、新しいキャラクターを作成します。'
                : 'どのようにキャラクターを作成しますか？'}
          </p>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => {
              onManualCreate();
              onClose();
            }}
            className={`w-full flex items-center justify-center p-4 rounded-lg border transition-colors ${isDarkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-300 hover:bg-slate-100'}`}
          >
            <FaPen className="mr-3 text-indigo-400" />
            <div>
              <p className="font-semibold">{baseCharacter ? '手動で編集' : '手動で作成'}</p>
              <p className="text-xs text-left opacity-70">
                {baseCharacter ? 'ベースキャラクターの設定を引き継いで編集します。' : 'すべての設定を自分で細かく調整します。'}
              </p>
            </div>
          </button>
          <button
            onClick={() => {
              onQuickCreate();
              onClose();
            }}
            className={`w-full flex items-center justify-center p-4 rounded-lg border transition-colors ${isDarkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-300 hover:bg-slate-100'}`}
          >
            <FaRobot className="mr-3 text-pink-400" />
            <div>
              <p className="font-semibold">{baseCharacter ? 'AIで編集' : 'AIでクイック作成'}</p>
              <p className="text-xs text-left opacity-70">
                {baseCharacter ? 'ベースキャラクターの特徴を保ちつつ、AIがアレンジします。' : '簡単な指示からAIがキャラクターを生成します。'}
              </p>
            </div>
          </button>
        </div>
        <div className="mt-6 text-center">
            <button onClick={onClose} className={`px-5 py-2 text-sm rounded-lg hover:bg-opacity-80 transition-colors ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                キャンセル
            </button>
        </div>
      </div>
    </div>
  );
};

export default NewCharacterChoiceModal;
