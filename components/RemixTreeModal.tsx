import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FaTimes, FaRobot, FaProjectDiagram } from 'react-icons/fa';

interface RemixTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootCharacterId: string; // The public ID to start the tree from (could be a child or parent)
  characterName: string;
  isDarkMode: boolean;
}

interface TreeNode {
  id: string;
  name: string;
  icon_url: string;
  parent_id: string | null;
  children: TreeNode[];
}

const RemixTreeModal: React.FC<RemixTreeModalProps> = ({
  isOpen,
  onClose,
  rootCharacterId,
  characterName,
  isDarkMode,
}) => {
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);

  const generalPanelBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const generalTextColor = isDarkMode ? 'text-slate-200' : 'text-slate-700';
  const lineColor = isDarkMode ? 'border-slate-600' : 'border-slate-300';

  useEffect(() => {
    if (isOpen && rootCharacterId) {
      fetchTreeData(rootCharacterId);
    }
  }, [isOpen, rootCharacterId]);

  const fetchTreeData = async (startId: string) => {
    setLoading(true);
    try {
      // 1. Fetch the target character to find the ultimate root (ancestor)
      // This is a simplification; for a true tree we might need recursive queries.
      // We will try to go up to find the root, then fetch all descendants of that root.
      // Due to RLS and limitations, we might just do 1 level up and N levels down, or use a stored procedure if available.
      // Let's try a client-side approach for small trees:
      // Fetch all public characters (or a subset) and build tree? No, too heavy.
      // Let's just fetch the immediate family for now, or assume we have a 'root_id' if we had designed it that way.
      // Since we only have parent_id, we have to walk up.

      let currentId = startId;
      let rootId = startId;

      // Walk up to find root (limit 5 levels to avoid infinite loops)
      for (let i = 0; i < 5; i++) {
          const { data, error } = await supabase
              .from('public_characters')
              .select('id, parent_id')
              .eq('id', currentId)
              .single();

          if (error || !data) break;
          if (!data.parent_id) {
              rootId = data.id;
              break;
          }
          currentId = data.parent_id;
          rootId = data.parent_id; // Update root candidate
      }

      // Now fetch all characters connected to this root (this is hard without a common group ID).
      // A proper implementation would need a 'thread_id' or recursive CTE.
      // Given the constraints, let's just fetch:
      // 1. The Root
      // 2. Children of Root
      // 3. Grandchildren of Root (simplified depth 2)

      const { data: rootData } = await supabase
        .from('public_characters')
        .select('id, name, icon_url, parent_id')
        .eq('id', rootId)
        .single();

      if (!rootData) throw new Error("Root not found");

      const { data: descendants } = await supabase
        .from('public_characters')
        .select('id, name, icon_url, parent_id')
        .or(`parent_id.eq.${rootId},parent_id.in.(${// Subquery workaround logic is complex in JS string builder
            // Let's just fetch direct children first, then their children.
            // Actually, let's fetch all public characters for this demo if the dataset is small?
            // No, user might have thousands.
            // Let's stick to simple parent -> children visualization for the immediate context.
             rootId
        })`);

      // Better approach for MVP:
      // Just show: [Parent (if exists)] -> [Current] -> [Children]

      // Let's rebuild the visual logic to be: Focus on 'startId' (Current).
      // Show Parent (if any).
      // Show Children (if any).

      const { data: currentData } = await supabase
        .from('public_characters')
        .select('id, name, icon_url, parent_id')
        .eq('id', rootCharacterId)
        .single();

      if (!currentData) return;

      let parentNode = null;
      if (currentData.parent_id) {
          const { data: parent } = await supabase
            .from('public_characters')
            .select('id, name, icon_url')
            .eq('id', currentData.parent_id)
            .single();
            parentNode = parent;
      }

      const { data: children } = await supabase
        .from('public_characters')
        .select('id, name, icon_url')
        .eq('parent_id', rootCharacterId);

      // Construct a local tree object centered on current
      const node: TreeNode = {
          id: currentData.id,
          name: currentData.name,
          icon_url: currentData.icon_url,
          parent_id: currentData.parent_id,
          children: (children || []).map((c: any) => ({ ...c, children: [] }))
      };

      // If we have a parent, wrap the current node as a child of parent
      if (parentNode) {
           setTreeData({
               ...parentNode,
               parent_id: null, // We stop looking up here
               children: [node] // Current is a child of Parent
           });
      } else {
           setTreeData(node);
      }

    } catch (error) {
      console.error("Error fetching tree:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderNode = (node: TreeNode, isCurrent: boolean) => {
    return (
      <div className="flex flex-col items-center mx-4">
        <div className={`
            w-16 h-16 rounded-full overflow-hidden border-2 mb-2 shadow-sm
            ${isCurrent ? 'border-green-500 ring-2 ring-green-300' : 'border-gray-300'}
        `}>
          {node.icon_url ? (
            <img src={node.icon_url} alt={node.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">?</div>
          )}
        </div>
        <div className={`text-sm font-medium ${generalTextColor} text-center max-w-[100px] truncate`}>
          {node.name}
        </div>
        {node.children && node.children.length > 0 && (
          <div className="flex mt-4 relative">
             {/* Lines would go here in a complex implementation */}
             {node.children.map(child => (
                 <div key={child.id} className="relative flex flex-col items-center">
                     <div className={`h-4 border-l-2 ${lineColor} absolute -top-4 left-1/2`}></div>
                     {renderNode(child, child.id === rootCharacterId)}
                 </div>
             ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${generalPanelBgColor} ${generalTextColor} p-6 rounded-xl shadow-2xl w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar`}>
        <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-slate-700">
            <h3 className="text-xl font-bold flex items-center">
                <FaProjectDiagram className="mr-2 text-indigo-500" />
                リミックスツリー: {characterName}
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 transition-colors">
                <FaTimes size={20} />
            </button>
        </div>

        <div className="flex justify-center min-h-[300px] items-center">
             {loading ? (
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
             ) : treeData ? (
                 <div className="flex flex-col items-center">
                     {renderNode(treeData, treeData.id === rootCharacterId)}
                 </div>
             ) : (
                 <p className="opacity-60">リミックス情報が見つかりませんでした。</p>
             )}
        </div>
      </div>
    </div>
  );
};

export default RemixTreeModal;
