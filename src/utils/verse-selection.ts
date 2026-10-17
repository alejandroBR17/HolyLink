export function selectProjectionVerse(verses:ReadonlyArray<{text:string;ref:string}>,options:{text?:string|null;ref?:string|null;index?:number|null;loop?:number;offset?:number;timeMs:number}){
  if(options.text)return {verse:{text:options.text,ref:options.ref||'Mensagem'},keyId:'custom'};
  if(!verses.length)return {verse:{text:'',ref:''},keyId:'empty'};
  if(options.index!==null&&options.index!==undefined){const index=Math.max(0,Math.min(options.index,verses.length-1));return {verse:verses[index],keyId:`idx_${index}`};}
  const base=options.loop??Math.floor(options.timeMs/15000);
  const index=((base+(options.offset||0))%verses.length+verses.length)%verses.length;
  return {verse:verses[index],keyId:`auto_${index}`};
}
