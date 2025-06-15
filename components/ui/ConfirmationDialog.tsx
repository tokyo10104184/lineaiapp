import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDarkMode?: boolean; // Optional, for styling consistency if needed from caller
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDarkMode = false, // Default to false if not provided
}) => {
  if (!isOpen) {
    return null;
  }

  const panelBgColor = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const titleTextColor = isDarkMode ? 'text-slate-100' : 'text-slate-900';
  const messageTextColor = isDarkMode ? 'text-slate-300' : 'text-slate-700';
  const cancelButtonBorderColor = isDarkMode ? 'border-slate-600' : 'border-slate-300';
  const cancelButtonTextColor = isDarkMode ? 'text-slate-200' : 'text-slate-700';
  const cancelButtonHoverBgColor = isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50';

  // Specific styling for confirm button (often red for destructive actions)
  const confirmButtonBgColor = 'bg-red-600';
  const confirmButtonHoverBgColor = 'hover:bg-red-700';
  const confirmButtonTextColor = 'text-white';


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-150 ease-in-out">
      <div className={`${panelBgColor} p-6 rounded-lg shadow-xl w-full max-w-md mx-auto`}>
        <h2 className={`text-xl font-semibold mb-4 ${titleTextColor}`}>
          {title}
        </h2>
        <p className={`mb-6 ${messageTextColor} whitespace-pre-wrap`}>
          {message}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-md border ${cancelButtonBorderColor} ${cancelButtonTextColor} ${cancelButtonHoverBgColor} transition-colors duration-150 ease-in-out`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md ${confirmButtonBgColor} ${confirmButtonHoverBgColor} ${confirmButtonTextColor} transition-colors duration-150 ease-in-out`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
