import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  if (!isOpen) return null;

  // Optional: Handle backdrop click to cancel
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
      onClick={handleBackdropClick} // Added backdrop click handler
    >
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl w-full max-w-sm m-4 transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-fadeInScale">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-7 whitespace-pre-wrap">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            type="button" // Good practice for buttons not submitting forms
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900 dark:focus:ring-slate-400 rounded-lg transition-colors duration-150"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            type="button" // Good practice
            // Using red for confirm as it's often for destructive actions.
            // Consider making button styles more configurable if needed elsewhere.
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-900 rounded-lg transition-colors duration-150"
          >
            {confirmText}
          </button>
        </div>
      </div>
      {/* Basic CSS animation for entry */}
      <style jsx global>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeInScale {
          animation: fadeInScale 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ConfirmationDialog;
