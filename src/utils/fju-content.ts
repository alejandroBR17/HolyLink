export const FJU_CARDS:Record<string,{title:string;subtitle:string;label?:string;layout?:'welcome'|'statement'|'split';symbol:'hand'|'seat'|'door'|'phone'|'chat'|'mute'|'fire'|'social'|'people'}>={
 fju_welcome:{title:'Bom ter você aqui',subtitle:'Esse encontro também é seu. Chega junto!',label:'FJU / ENCONTRO JOVEM',layout:'welcome',symbol:'hand'},
 fju_first_time:{title:'É sua primeira vez?',subtitle:'Fique à vontade. Esse encontro também é seu.',label:'CHEGA JUNTO',symbol:'hand'},
 fju_together:{title:'Ninguém fica de fora',subtitle:'Convide quem está perto a participar com você.',label:'JUNTOS NO ENCONTRO',layout:'statement',symbol:'people'},
 fju_support:{title:'Quer conversar?',subtitle:'Se precisar, converse com um obreiro.',label:'CONTE COM A GENTE',symbol:'chat'},
 fju_goodbye:{title:'Valeu pela presença',subtitle:'Leve essa experiência com você. Até o próximo encontro!',label:'A GENTE SE ENCONTRA',layout:'welcome',symbol:'hand'},
 social:{title:'Universal Jardim Osasco',subtitle:'@universaljardimosascooficial',label:'INSTAGRAM DA IGREJA',symbol:'social'},
 seat:{title:'Chega mais',subtitle:'Encontre seu lugar e participe com a gente.',symbol:'hand'},
 bathroom:{title:'Precisa ir ao banheiro?',subtitle:'Aproveite antes do encontro.',symbol:'door'},
 phone:{title:'Sem distração',subtitle:'Coloque o celular no silencioso e fique ligado no encontro.',symbol:'phone'},
 no_chat:{title:'Fica ligado',subtitle:'Evite conversas paralelas. Participe com a gente.',symbol:'mute'},
 soon:{title:'Vem pro encontro',subtitle:'Sua presença faz parte desse encontro.',symbol:'fire'},
};
export const FJU_PRE_SLIDES=['fju_welcome','seat','verse_1','fju_first_time','bathroom','fju_together','phone','verse_2','fju_support','world_god','no_chat','fju_agenda'];
export const FJU_POST_SLIDES=['fju_goodbye','fju_support','fju_agenda','fju_together'];

export const FJU_PROJECTS = [
 {id:'fju_project_sports',name:'Esportes',logo:'/brand/fju-project-esportes.png',description:'Movimento, união e superação.',color:'#68df6a'},
 {id:'fju_project_culture',name:'Cultura',logo:'/brand/fju-project-cultura.png',description:'Seu talento também tem lugar aqui.',color:'#ffbd51'},
 {id:'fju_project_media',name:'Mídia',logo:'/brand/fju-project-midia.png',description:'Criatividade para registrar e compartilhar.',color:'#90c4ff'},
] as const;
export const FJU_PROJECT_SLIDES=['fju_projects',...FJU_PROJECTS.map(p=>p.id)];
export const isFjuProject=(id:string)=>FJU_PROJECT_SLIDES.includes(id);
/** The project introduction always leads the three connected chapters. */
export function connectFjuProjects(ids:readonly string[]):string[]{
 const first=ids.findIndex(isFjuProject);if(first<0)return [...ids];
 const result=ids.filter(id=>!isFjuProject(id));
 result.splice(first,0,...FJU_PROJECT_SLIDES.filter(id=>ids.includes(id)));return result;
}
