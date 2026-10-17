/** Optional moments are prepared before the encounter and announced together in the pre-encounter loop. */
export const FJU_MOMENTS = [
    { id: 'fju_moment_music', name: 'Música', title: 'Vai ter música', subtitle: 'Um momento para cantar juntos.', label: 'MÚSICA', symbol: 'music' },
    { id: 'fju_moment_word', name: 'Palavra', title: 'Uma Palavra para você', subtitle: 'Mensagem de fé para levar à vida.', label: 'PALAVRA', symbol: 'book' },
    { id: 'fju_moment_games', name: 'Gincana', title: 'Desafio à vista', subtitle: 'A gincana está na programação.', label: 'GINCANA', symbol: 'trophy' },
    { id: 'fju_moment_sports', name: 'Esportes após o encontro', title: 'Depois tem esporte', subtitle: 'Fique para jogar após o encontro.', label: 'ESPORTES', symbol: 'ball' },
] as const;
export const isFjuMoment = (id: string) => FJU_MOMENTS.some(moment => moment.id === id);
export function isFjuMomentSelection(value: unknown): value is string[] {
    return Array.isArray(value) && value.length <= FJU_MOMENTS.length &&
        value.every(id => typeof id === 'string' && isFjuMoment(id)) && new Set(value).size === value.length;
}
/** Also accepts serialized state from storage, backup and a paired device. */
export function readFjuMoments(value: unknown): string[] {
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return isFjuMomentSelection(parsed) ? FJU_MOMENTS.filter(moment => parsed.includes(moment.id)).map(moment => moment.id) : [];
    }
    catch {
        return [];
    }
}
export function availablePreparedMoment(id: string, selection: readonly string[]): boolean {
    return !isFjuMoment(id) || selection.includes(id);
}
/** Announcements stay connected; old manual choices become pre-encounter queue entries. */
export function connectFjuMoments(ids: readonly string[]): string[] {
    const first = ids.findIndex(isFjuMoment);
    if (first < 0)
        return [...ids];
    const rest = ids.filter(id => !isFjuMoment(id));
    rest.splice(first, 0, ...FJU_MOMENTS.filter(moment => ids.includes(moment.id)).map(moment => moment.id));
    return rest;
}
export function preparedMomentSlides(selection: readonly string[], mode: 'pre' | 'post'): string[] {
    return mode === 'pre' ? FJU_MOMENTS.filter(moment => selection.includes(moment.id)).map(moment => moment.id) : [];
}
