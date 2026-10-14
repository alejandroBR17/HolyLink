export interface Passage {text: string; ref: string}
export function rememberPassage(history: Passage[], passage: Passage): Passage[] {
  return [passage, ...history.filter(item => item.ref !== passage.ref || item.text !== passage.text)].slice(0, 8);
}
export function readPassageHistory(): Passage[] {
  try {
    const value = JSON.parse(localStorage.getItem('holylink_bible_history_v1') || '[]');
    return Array.isArray(value) ? value.filter(item => typeof item?.text === 'string' && item.text.length > 0 && item.text.length <= 100000 && typeof item?.ref === 'string' && item.ref.length <= 200).slice(0, 8) : [];
  } catch {return [];}
}
