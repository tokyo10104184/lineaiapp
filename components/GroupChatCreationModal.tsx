import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaUsers } from 'react-icons/fa';

interface Character {
  id: string;
  name: string;
  icon: string;
}

interface GroupChatCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  onCreateGroup: (selectedCharacterIds: string[], groupName: string) => void;
  isDarkMode: boolean;
}

const GroupChatCreationModal: React.FC<GroupChatCreationModalProps> = ({
  isOpen,
  onClose,
  characters,
  onCreateGroup,
  isDarkMode,
}) => {
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedCharacterIds([]);
      setGroupName('');
    }
  }, [isOpen]);

  const handleToggleCharacter = (characterId: string) => {
    setSelectedCharacterIds((prevSelected) =>
      prevSelected.includes(characterId)
        ? prevSelected.filter((id) => id !== characterId)
        : [...prevSelected, characterId]
    );
  };

  const canCreateGroup = useMemo(() => {
    return selectedCharacterIds.length >= 2 && selectedCharacterIds.length <= 5;
  }, [selectedCharacterIds]);

  const handleSubmit = () => {
    if (!canCreateGroup) return;
    onCreateGroup(selectedCharacterIds, groupName.trim());
  };

  // These constants should be used by the JSX below
  const panelBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-700';
  const inputFieldBgColor = isDarkMode ? 'bg-slate-700' : 'bg-slate-100';
  const inputBorderColor = isDarkMode ? 'border-slate-600' : 'border-slate-300';
  const buttonDisabledColor = isDarkMode ? 'bg-slate-600 cursor-not-allowed' : 'bg-slate-400 cursor-not-allowed';
  const buttonEnabledColor = 'bg-indigo-600 hover:bg-indigo-700 text-white';

  if (!isOpen) return null;

  // === THIS IS THE JSX TO BE RECONSTRUCTED ===
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${panelBgColor} ${textColor} p-6 rounded-xl shadow-2xl w-[95vw] sm:max-w-lg max-h-[90vh] flex flex-col`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold flex items-center">
            <FaUsers className="mr-3 text-indigo-500" />
            グループチャット作成
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-200'} transition-colors`}
          >
            <FaTimes size={22} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-5 pr-1 custom-scrollbar">
          <div>
            <label htmlFor="groupNameModalInput" className="block text-sm font-medium mb-1.5">
              グループ名 (任意)
            </label>
            <input
              type="text"
              id="groupNameModalInput" // Changed id to avoid conflict if another "groupName" id exists
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="例: 楽しい仲間たち"
              className={`w-full p-2.5 border rounded-lg shadow-sm ${inputFieldBgColor} ${textColor} ${inputBorderColor} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              キャラクター選択 (2〜5体)
              <span className="ml-2 text-xs opacity-80">
                ({selectedCharacterIds.length}体選択中)
              </span>
            </label>
            {characters.length < 2 ? (
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>グループチャットを作成するには、少なくとも2体のキャラクターが必要です。</p>
            ) : (
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1 custom-scrollbar border rounded-md ${inputBorderColor}`}>
                {characters.map((char) => (
                    <label
                    key={char.id}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-150
                                ${selectedCharacterIds.includes(char.id)
                                ? (isDarkMode ? 'bg-indigo-500 text-white shadow-md ring-2 ring-indigo-400' : 'bg-indigo-100 text-indigo-700 shadow-md ring-2 ring-indigo-300')
                                : (isDarkMode ? `bg-slate-700 hover:bg-slate-600/80` : `bg-slate-50 hover:bg-slate-100`)}
                                ${ (selectedCharacterIds.length >= 5 && !selectedCharacterIds.includes(char.id)) ? 'opacity-60 cursor-not-allowed' : '' }
                            `}
                    >
                    <input
                        type="checkbox"
                        checked={selectedCharacterIds.includes(char.id)}
                        onChange={() => handleToggleCharacter(char.id)}
                        className="form-checkbox h-5 w-5 text-indigo-600 rounded border-slate-400 focus:ring-indigo-500 mr-3 shrink-0"
                        disabled={selectedCharacterIds.length >= 5 && !selectedCharacterIds.includes(char.id)}
                    />
                    <div className="flex items-center min-w-0">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full shadow-sm mr-2.5 shrink-0 overflow-hidden bg-gray-300">
                          {char.icon?.startsWith('data:') || char.icon?.startsWith('http') ? (
                            <img src={char.icon} alt={char.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">{char.icon || '👤'}</span>
                          )}
                        </div>
                        <span className="text-sm font-medium truncate" title={char.name}>{char.name}</span>
                    </div>
                    </label>
                ))}
                </div>
            )}
          </div>
          {selectedCharacterIds.length > 0 && selectedCharacterIds.length < 2 && (
            <p className="text-xs text-red-500 dark:text-red-400">
              最低2体のキャラクターを選択してください。
            </p>
          )}
           {selectedCharacterIds.length > 5 && ( // This condition should ideally not be met if disabled logic is correct
            <p className="text-xs text-red-500 dark:text-red-400">
              最大5体のキャラクターまで選択できます。
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t" style={{borderColor: inputBorderColor}}>
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-lg border ${inputBorderColor} ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} transition-colors duration-150 w-full sm:w-auto font-medium shadow-sm`}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canCreateGroup}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors duration-150 w-full sm:w-auto shadow-md
                        ${!canCreateGroup ? buttonDisabledColor : buttonEnabledColor}`}
          >
            作成
          </button>
        </div>
      </div>
    </div>
  );
  // === END OF RECONSTRUCTED JSX ===
};

export default GroupChatCreationModal;
