import {useEffect, useRef} from 'react';
export function useDialogFocus(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  useEffect(() => {closeRef.current = close;}, [close]);
  useEffect(() => {
    if (!open || !ref.current) return;
    const dialog = ref.current, previous = document.activeElement as HTMLElement | null;
    const items = () => [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(el => el.getClientRects().length > 0);
    (items()[0] || dialog).focus();
    const keydown = (event: KeyboardEvent) => {
      const dialogs = [...document.querySelectorAll('[role="dialog"]')];
      if (dialogs.at(-1) !== dialog) return;
      if (event.key === 'Escape') {event.preventDefault(); event.stopPropagation(); closeRef.current();}
      if (event.key === 'Tab') {
        const all = items(), first = all[0], last = all.at(-1);
        if (!first) {event.preventDefault(); dialog.focus();}
        else if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last?.focus();}
        else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
      }
    };
    document.addEventListener('keydown', keydown, true);
    return () => {document.removeEventListener('keydown', keydown, true); if (previous?.isConnected) previous.focus();};
  }, [open]);
  return ref;
}
