import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from './ui/button';
import ConfirmationDialog from './ui/ConfirmationDialog';
import { PublicCharacterCard } from './Marketplace'; // Reuse the type from Marketplace

const AdminPanel: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const { session } = useAuth();
  const [characters, setCharacters] = useState<PublicCharacterCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<PublicCharacterCard | null>(null);

  const fetchCharacters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/public-characters');
      if (!response.ok) throw new Error('Failed to fetch characters');
      const data = await response.json();
      setCharacters(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const handleDeleteClick = (character: PublicCharacterCard) => {
    setCharacterToDelete(character);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!characterToDelete || !session) return;

    try {
      const response = await fetch('/api/admin/delete-character', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ character_id: characterToDelete.id }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to delete character');
      }

      // Refresh the list after deletion
      fetchCharacters();

    } catch (err: any) {
      alert(`Error deleting character: ${err.message}`);
    } finally {
      setShowConfirmDialog(false);
      setCharacterToDelete(null);
    }
  };

  const panelBg = isDarkMode ? 'bg-slate-900/50' : 'bg-slate-100';
  const textColor = isDarkMode ? 'text-slate-300' : 'text-slate-700';

  return (
    <div className={`p-4 rounded-lg mt-4 ${panelBg}`}>
      <h3 className="text-xl font-semibold mb-4">管理者パネル</h3>
      {loading && <p>Loading characters...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
        {characters.map(char => (
          <div key={char.id} className={`p-2 rounded-md flex justify-between items-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div>
              <p className="font-semibold">{char.name}</p>
              <p className="text-xs opacity-70">by {char.username || 'Unknown'} (ID: {char.id})</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(char)}>
              強制削除
            </Button>
          </div>
        ))}
      </div>

      {showConfirmDialog && characterToDelete && (
        <ConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleConfirmDelete}
          title="キャラクターの強制削除"
          message={`本当にキャラクター「${characterToDelete.name}」を削除しますか？この操作は元に戻せません。`}
          confirmText="削除"
          cancelText="キャンセル"
        />
      )}
    </div>
  );
};

export default AdminPanel;
