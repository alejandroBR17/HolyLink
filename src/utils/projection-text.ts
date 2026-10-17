// Keep full text, splitting at word boundaries for a readable 16:9 slide.
export function paginateProjectionText(text: string, limit = 320): string[] {
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('Page limit must be a positive integer');
  const words = text.trim().split(/\s+/u).filter(Boolean);
  if (!words.length) return [];
  const pages: string[] = [];
  let page = '';
  for (const original of words) {
    let word = original;
    // A pasted URL or uninterrupted token must not overflow an entire slide.
    const characters = Array.from(word);
    if (characters.length > limit) {
      if (page) {pages.push(page); page = '';}
      while (characters.length > limit) pages.push(characters.splice(0, limit).join(''));
      word = characters.join('');
    }
    if (page && page.length + word.length + 1 > limit) {
      const endings = [...page.matchAll(/[.!?;:]\s+/gu)];
      const ending = endings.at(-1);
      const split = ending ? ending.index + 1 : 0;
      if (split >= limit / 2) {pages.push(page.slice(0, split)); page = page.slice(split).trim();}
      if (page && page.length + word.length + 1 > limit) {pages.push(page); page = '';}
    }
    page = page ? `${page} ${word}` : word;
  }
  if (page) pages.push(page);
  return pages;
}
export function projectionFontSize(text: string): number {
  return Math.max(30, Math.min(88, Math.floor(Math.sqrt(1640000 / Math.max(1, text.length)))));
}
