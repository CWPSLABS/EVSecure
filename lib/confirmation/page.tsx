// components/ConfirmDialog.tsx
"use client";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  confirmValue?: string;
  onConfirmValueChange?: (value: string) => void;
  confirmButtonText?: string;
  isDangerous?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  confirmValue,
  onConfirmValueChange,
  confirmButtonText = "Confirm",
  isDangerous = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const canConfirm = confirmText ? confirmValue === confirmText : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-2 rounded-lg ${isDangerous ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
            <svg 
              className={`w-6 h-6 ${isDangerous ? 'text-red-400' : 'text-yellow-400'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>

        {confirmText && onConfirmValueChange && (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              Type <code className="px-2 py-0.5 bg-slate-900 rounded text-red-400">{confirmText}</code> to confirm
            </label>
            <input
              type="text"
              value={confirmValue}
              onChange={(e) => onConfirmValueChange(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              placeholder={confirmText}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDangerous
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}