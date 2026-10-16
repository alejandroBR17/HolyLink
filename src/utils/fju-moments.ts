/** Optional moments are prepared before the encounter and projected manually. */
export const FJU_MOMENTS = [
  {id:'fju_moment_music',name:'Música',title:'Solta a voz',subtitle:'Participe com a gente.',label:'MÚSICA',symbol:'music'},
  {id:'fju_moment_word',name:'Palavra',title:'Hora da Palavra',subtitle:'Atenção à mensagem.',label:'PALAVRA',symbol:'book'},
  {id:'fju_moment_games',name:'Gincana',title:'Bora participar',subtitle:'Juntos na gincana.',label:'GINCANA',symbol:'trophy'},
  {id:'fju_moment_sports',name:'Esportes após o encontro',title:'Depois tem esporte',subtitle:'Participe após o encontro.',label:'ESPORTES',symbol:'ball'},
] as const;

export const isFjuMoment = (id:string) => FJU_MOMENTS.some(moment => moment.id===id);

export function isFjuMomentSelection(value:unknown):value is string[] {
  return Array.isArray(value) && value.length<=FJU_MOMENTS.length &&
    value.every(id=>typeof id==='string' && isFjuMoment(id)) && new Set(value).size===value.length;
}

/** Also accepts serialized state from storage, backup and a paired device. */
export function readFjuMoments(value:unknown):string[] {
  try {
    const parsed=typeof value==='string'?JSON.parse(value):value;
    return isFjuMomentSelection(parsed)?FJU_MOMENTS.filter(moment=>parsed.includes(moment.id)).map(moment=>moment.id):[];
  } catch { return []; }
}

export function availablePreparedMoment(id:string,selection:readonly string[]):boolean {
  return !isFjuMoment(id) || selection.includes(id);
}
