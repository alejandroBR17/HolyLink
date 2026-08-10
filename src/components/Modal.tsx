import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2, XCircle, Info, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'info';
}

export const CustomModal: React.FC<ModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'info'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-stone-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white uppercase tracking-wider">{title}</h3>
              </div>
              
              <p className="text-stone-400 text-lg leading-relaxed mb-8">
                {message}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5 uppercase tracking-widest text-sm"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-6 py-4 rounded-2xl font-bold transition-all uppercase tracking-widest text-sm ${
                    variant === 'danger' 
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20' 
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
            
            <button 
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 text-stone-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'error' | 'success' | 'info';
}

export const CustomToast: React.FC<ToastProps> = ({ message, isVisible, onClose, type = 'info' }) => {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          className="fixed bottom-10 left-1/2 z-[10000] min-w-[320px] max-w-md"
        >
          <div className={`flex items-center gap-4 p-5 rounded-2xl border backdrop-blur-xl shadow-2xl ${
            type === 'error' 
              ? 'bg-red-950/90 border-red-500/40 text-red-300' 
              : type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
              : 'bg-stone-900/90 border-amber-500/40 text-amber-300'
          }`}>
            {type === 'error' && <XCircle className="w-6 h-6 shrink-0 text-red-400" />}
            {type === 'success' && <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />}
            {type === 'info' && <Info className="w-6 h-6 shrink-0 text-amber-400" />}
            
            <p className="flex-1 font-semibold text-sm tracking-wide text-stone-100">{message}</p>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-stone-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
