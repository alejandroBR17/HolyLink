export const FJU_CARDS:Record<string,{title:string;subtitle:string;label?:string;layout?:'welcome'|'statement'|'split';symbol:'hand'|'seat'|'door'|'phone'|'chat'|'mute'|'fire'|'social'|'heart'}>={
 fju_welcome:{title:'Bom ter você aqui',subtitle:'Esse encontro também é seu. Chega junto!',label:'FJU / ENCONTRO JOVEM',layout:'welcome',symbol:'hand'},
 fju_first_time:{title:'É sua primeira vez?',subtitle:'Pode chegar. Fale com a equipe e conheça a FJU.',label:'CHEGA JUNTO',symbol:'hand'},
 fju_together:{title:'Ninguém fica de fora',subtitle:'Convide quem está perto a participar com você.',label:'JUNTOS NO ENCONTRO',layout:'statement',symbol:'heart'},
 fju_support:{title:'Quer conversar?',subtitle:'Procure a equipe da FJU. Você não precisa ficar sozinho.',label:'CONTE COM A GENTE',symbol:'chat'},
 fju_goodbye:{title:'Valeu pela presença',subtitle:'Leve essa experiência com você. Até o próximo encontro!',label:'A GENTE SE ENCONTRA',layout:'welcome',symbol:'hand'},
 social:{title:'Acompanhe a FJU',subtitle:'Fique por dentro dos avisos da equipe.',symbol:'social'},
 seat:{title:'Chega mais',subtitle:'Encontre seu lugar e participe com a gente.',symbol:'hand'},
 bathroom:{title:'Precisa ir ao banheiro?',subtitle:'Aproveite antes do encontro.',symbol:'door'},
 phone:{title:'Sem distração',subtitle:'Coloque o celular no silencioso e fique ligado no encontro.',symbol:'phone'},
 no_chat:{title:'Fica ligado',subtitle:'Evite conversas paralelas. Participe com a gente.',symbol:'mute'},
 soon:{title:'Vem pro encontro',subtitle:'Sua presença faz parte desse encontro.',symbol:'fire'},
};
export const FJU_PRE_SLIDES=['fju_welcome','seat','verse_1','fju_first_time','bathroom','fju_together','phone','verse_2','fju_support','world_god','no_chat','fju_agenda'];
export const FJU_POST_SLIDES=['fju_goodbye','fju_support','fju_agenda','fju_together'];
