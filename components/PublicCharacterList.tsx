import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart, FaMagic, FaPlus, FaGlobe } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { getOrCreateAnonymousUserId } from '../lib/utils';
import { Character } from '../lib/types';

interface PublicCharacterListProps {
  onSelectCharacter: (char: Character) => void;
  onRemixCharacter: (char: Character) => void;
  isDarkMode: boolean;
}

type SortOption = 'newest' | 'favorites';

const PublicCharacterList: React.FC<PublicCharacterListProps> = ({
  onSelectCharacter,
  onRemixCharacter,
  isDarkMode,
}) => {
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('favorites');
  const [userId, setUserId] = useState<string>('');

  const generalTextColor = isDarkMode ? 'text-slate-200' : 'text-slate-700';
  const cardBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDarkMode ? 'border-slate-700' : 'border-slate-200';

  useEffect(() => {
    setUserId(getOrCreateAnonymousUserId());
  }, []);

  useEffect(() => {
    if (userId) {
        fetchCharacters();
    }
  }, [sortBy, userId]);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      // 1. Fetch public characters (all of them)
      let query = supabase
        .from('public_characters')
        .select('*');

      // Sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('favorites_count', { ascending: false });
      }

      const { data: charactersData, error: charactersError } = await query;
      if (charactersError) throw charactersError;

      // 2. Fetch "my" favorites to check which ones I liked
      // We do this in a separate query to avoid the inner join behavior of PostgREST
      // when filtering a joined table, or complex !left syntax issues.
      let myFavoriteIds = new Set<string>();
      if (charactersData && charactersData.length > 0) {
          const { data: favoritesData, error: favoritesError } = await supabase
            .from('character_favorites')
            .select('character_id')
            .eq('user_id', userId);

          if (!favoritesError && favoritesData) {
              favoritesData.forEach((fav: any) => myFavoriteIds.add(fav.character_id));
          }
      }

      const formattedData = charactersData.map((char: any) => ({
        ...char,
        isFavorited: myFavoriteIds.has(char.id),
      }));

      setCharacters(formattedData);
    } catch (error) {
      console.error('Error fetching public characters:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (charId: string, currentIsFavorited: boolean) => {
    if (!userId) return;

    // Optimistic update
    setCharacters(prev => prev.map(c => {
        if (c.id === charId) {
            return {
                ...c,
                isFavorited: !currentIsFavorited,
                favorites_count: (c.favorites_count || 0) + (currentIsFavorited ? -1 : 1)
            };
        }
        return c;
    }));

    try {
      if (currentIsFavorited) {
        await supabase
          .from('character_favorites')
          .delete()
          .match({ character_id: charId, user_id: userId });

        // Decrement count on table via RPC
        await supabase.rpc('decrement_favorites_count', { row_id: charId });

      } else {
        await supabase
          .from('character_favorites')
          .insert({ character_id: charId, user_id: userId });

        // Increment count on table via RPC
        await supabase.rpc('increment_favorites_count', { row_id: charId });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert on error could be implemented here
    }
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h2 className={`text-2xl font-bold ${generalTextColor} flex items-center`}>
            <FaGlobe className="mr-3 text-indigo-500" />
            公開キャラクター
            </h2>
            <p className={`text-sm opacity-70 ${generalTextColor} mt-1`}>
                みんなが作成したキャラクターを見つけよう
            </p>
        </div>

        <div className={`flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1`}>
          <button
            onClick={() => setSortBy('favorites')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              sortBy === 'favorites'
                ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
             人気順
          </button>
          <button
            onClick={() => setSortBy('newest')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              sortBy === 'newest'
                ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-300'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
             新着順
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => (
            <div
              key={char.id}
              className={`border ${borderColor} ${cardBgColor} rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                     {char.icon_url ? (
                         <img src={char.icon_url} alt={char.name} className="w-full h-full object-cover" />
                     ) : (
                         <span className="flex items-center justify-center h-full text-xl">?</span>
                     )}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-bold text-lg truncate ${generalTextColor}`}>{char.name}</h3>
                    <p className={`text-xs opacity-60 truncate ${generalTextColor}`}>
                        by {char.author_id === userId ? 'あなた' : 'Unknown'}
                    </p>
                  </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(char.id, char.isFavorited); }}
                    className={`flex items-center space-x-1 text-sm font-medium transition-colors ${char.isFavorited ? 'text-pink-500' : 'text-slate-400 hover:text-pink-400'}`}
                >
                    {char.isFavorited ? <FaHeart /> : <FaRegHeart />}
                    <span>{char.favorites_count || 0}</span>
                </button>
              </div>

              <p className={`text-sm ${generalTextColor} opacity-80 mb-4 line-clamp-2 flex-grow`}>
                {char.description}
              </p>

              <div className="flex space-x-2 mt-auto pt-3 border-t dark:border-slate-700 border-slate-100">
                <button
                    onClick={() => onSelectCharacter({
                        id: `public-${char.id}`, // Temporary ID
                        name: char.name,
                        description: char.description,
                        systemPrompt: char.system_prompt,
                        icon: char.icon_url,
                        isPublic: true,
                        public_id: char.id,
                        author_id: char.author_id,
                        parent_id: char.parent_id
                    } as Character)}
                     className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors flex items-center justify-center`}
                >
                    <FaPlus className="mr-2" /> 追加
                </button>

                <button
                    onClick={() => onRemixCharacter({
                        id: `remix-base-${char.id}`,
                        name: char.name,
                        description: char.description,
                        systemPrompt: char.system_prompt,
                        icon: char.icon_url,
                        isPublic: true, // source is public
                        public_id: char.id
                    } as Character)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border border-indigo-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 transition-colors flex items-center justify-center`}
                    title="このキャラクターを元に新しいキャラを作る"
                >
                    <FaMagic className="mr-2" /> リミックス
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicCharacterList;
