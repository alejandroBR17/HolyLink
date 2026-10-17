export interface SymbolMotion {light:boolean;enabled:boolean;fps:30|60;detail:'low'|'medium'|'high'}
export function symbolMotion(style:string,quality:string,fps:30|60,detail:SymbolMotion['detail']):SymbolMotion{
 return {enabled:style!=='off',light:quality==='light'||style==='particles_2d',fps:quality==='high'?fps:30,detail:quality!=='high'&&detail==='high'?'medium':detail};
}
