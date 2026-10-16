export type ProjectionThemeMode = 'auto'|'fju'|'regular';
export function isYouthProjection(ongoing: {theme?: string} | null | undefined, next: {theme?: string} | null | undefined, nextDate: Date | null | undefined, now: Date, mode: ProjectionThemeMode = 'auto'): boolean {
  if(mode==='fju')return true;
  if(mode==='regular')return false;
  const youth = (theme = '') => /jovem|fju/i.test(theme);
  if (youth(ongoing?.theme)) return true;
  if (!youth(next?.theme)) return false;
  if (!nextDate) return true;
  const minutes = (nextDate.getTime() - now.getTime()) / 60000;
  return minutes <= 240 && minutes >= -90;
}
