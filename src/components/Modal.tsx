import {useDialogFocus} from '../hooks/useDialogFocus';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2, XCircle, Info, X, Trash2 } from 'lucide-react';

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
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'info'
}) => {
  const dialogRef = useDialogFocus(isOpen, onCancel);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const deletion = variant === 'danger' && /exclu|remov|apag/i.test(title);
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="holy-theme holy-overlay fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
            ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1} className={`holy-dialog holy-confirmation relative w-full ${variant === 'danger' ? 'holy-confirmation-danger' : ''}`}
          >
            <div className="holy-confirmation-header"><span className="holy-confirmation-icon">{deletion ? <Trash2 size={24}/> : variant === 'danger' ? <AlertTriangle size={24}/> : <Info size={24}/>}</span><div><span className="operator-eyebrow">{deletion ? 'Revisar exclusão' : 'Confirmar ação'}</span><h3 id={titleId}>{title}</h3></div></div>
            <p id={descriptionId} className="holy-confirmation-message">{message}</p>
            <div className="holy-confirmation-actions"><button className="holy-confirmation-cancel" onClick={onCancel}>{cancelLabel}</button><button className="holy-confirmation-accept" onClick={onConfirm}>{deletion && <Trash2 size={17}/>} {confirmLabel || (deletion ? 'Excluir' : 'Confirmar')}</button></div>
            <button onClick={onCancel} aria-label="Fechar confirmação" className="holy-confirmation-close"><X size={20}/></button>
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
          role="status" aria-live={type === 'error' ? 'assertive' : 'polite'} className={`holy-theme holy-toast holy-toast-${type} fixed bottom-10 left-1/2 z-[10000] max-w-md`}
        >
          <div className={`flex items-center gap-4 p-5 rounded-2xl border backdrop-blur-xl shadow-2xl ${
            type === 'error'
              ? 'bg-red-950/90 border-red-500/40 text-red-300'
              : type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
              : 'bg-hl-panel/90 border-hl-gold/40 text-hl-gold-bright'
          }`}>
            {type === 'error' && <XCircle className="w-6 h-6 shrink-0 text-red-400" />}
            {type === 'success' && <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />}
            {type === 'info' && <Info className="w-6 h-6 shrink-0 text-hl-gold-bright" />}

            <p className="flex-1 font-semibold text-sm tracking-wide text-hl-copy">{message}</p>
            <button onClick={onClose} aria-label="Fechar aviso" className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-hl-muted hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
