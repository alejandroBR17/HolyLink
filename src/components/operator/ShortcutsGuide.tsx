import React from 'react';
const groups = [
  {title:'Navegar na fila',items:[['next','Próximo slide','Espaço / → / PgDn'],['previous','Slide anterior','← / PgUp'],['resume','Retomar fila e retirar avisos','Esc']]},
  {title:'Controlar a saída',items:[['blackout','Alternar tela preta','B'],['clear','Ocultar ou mostrar conteúdo','C'],['mute','Silenciar ou ativar áudio','M'],['fullscreen','Tela cheia neste aparelho','F'],['mode','Alternar pré/pós-reunião','P']]},
  {title:'Abrir uma seção',items:[['slides','Sequência','1'],['texts','Bíblia','2'],['agenda','Agenda','3'],['controls','Ajustes','4'],['sync','Conexão','5']]},
];
export function ShortcutsGuide({onCommand}: {onCommand?:(id:string)=>void}) {
  return <div className="shortcuts-guide"><p className="operator-muted">Atalhos deste aparelho. Não disparam enquanto você digita, usa um seletor ou está em um diálogo. Esc fecha a projeção local antes de retomar a fila.</p>{groups.map(group => <section key={group.title}><h4>{group.title}</h4><dl>{group.items.map(([id,label,key]) => <div key={id}><dt>{onCommand ? <button onClick={() => onCommand(id)}>{label}</button> : label}</dt><dd><kbd>{key}</kbd></dd></div>)}</dl></section>)}</div>;
}
