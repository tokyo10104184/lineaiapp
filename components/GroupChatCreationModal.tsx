import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaUsers } from 'react-icons/fa';

interface Character {
  id: string;
  name: string;
  icon: string;
  color: string;
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

  // These constants are no longer used by the simplified JSX but are kept as per instructions
  // to not modify parts of the file before the return statement.
  const panelBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-700';
  const inputFieldBgColor = isDarkMode ? 'bg-slate-700' : 'bg-slate-100';
  const inputBorderColor = isDarkMode ? 'border-slate-600' : 'border-slate-300';
  const buttonDisabledColor = isDarkMode ? 'bg-slate-600 cursor-not-allowed' : 'bg-slate-400 cursor-not-allowed';
  const buttonEnabledColor = 'bg-indigo-600 hover:bg-indigo-700 text-white';

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, padding: '20px' }}>
      <div style={{ backgroundColor: isDarkMode ? '#334155' : 'white', padding: '20px', borderRadius: '8px', margin: '40px auto', maxWidth: '500px', color: isDarkMode ? 'white' : 'black' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: '600' }}>Test Modal</h3>
          <button onClick={onClose} style={{ padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.5rem', color: isDarkMode ? 'white' : 'black' }}>
            &times; {/* HTML entity for a close icon */}
          </button>
        </div>
        <p style={{ marginBottom: '20px' }}>This is a simplified modal to test JSX parsing. Select characters and provide a name.</p>

        {/* Minimal version of character selection for functionality */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Characters (select 2-5):</label>
          {characters.map(char => (
            <div key={char.id}>
              <input
                type="checkbox"
                id={`simple_char_${char.id}`}
                checked={selectedCharacterIds.includes(char.id)}
                onChange={() => handleToggleCharacter(char.id)}
                disabled={selectedCharacterIds.length >= 5 && !selectedCharacterIds.includes(char.id)}
              />
              <label htmlFor={`simple_char_${char.id}`} style={{ marginLeft: '5px' }}>{char.name}</label>
            </div>
          ))}
          {selectedCharacterIds.length > 0 && selectedCharacterIds.length < 2 && (
            <p style={{ fontSize: '0.75rem', color: 'red' }}>
              Minimum 2 characters.
            </p>
          )}
        </div>

        {/* Minimal version of group name input for functionality */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="simple_groupName" style={{ display: 'block', marginBottom: '5px' }}>Group Name (optional):</label>
          <input
            type="text"
            id="simple_groupName"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <button onClick={onClose} style={{ padding: '10px 15px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canCreateGroup}
            style={{ padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: !canCreateGroup ? '#ccc' : '#007bff', color: 'white' }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatCreationModal;
