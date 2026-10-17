/** Move a connected announcement block as one unit without disturbing its chapters. */
export function moveQueueBlock(ids: readonly string[], id: string, direction: -1 | 1, groups: readonly (readonly string[])[]): string[] {
    const units: string[][] = [], used = new Set<string>();
    for (const item of ids) {
        if (used.has(item))
            continue;
        const group = groups.find(group => group.includes(item));
        const block = group ? group.filter(member => ids.includes(member)) : [item];
        units.push([...block]);
        block.forEach(member => used.add(member));
    }
    const from = units.findIndex(unit => unit.includes(id)), to = from + direction;
    if (from >= 0 && to >= 0 && to < units.length)
        [units[from], units[to]] = [units[to], units[from]];
    return units.flat();
}
