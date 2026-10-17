import {FJU_PROJECTS} from '../utils/fju-content';

/** Four chapters share a route marker, palette and the supplied transparent marks. */
export function FjuProjectsSlide({slideId}:{slideId:string}){
 const project=FJU_PROJECTS.find(p=>p.id===slideId);
 return <section className={`fju-project-stage ${project?'is-project':'is-overview'}`} style={{'--project-color':project?.color||'#90c4ff'} as React.CSSProperties}>
  <header><span>FJU / PROJETOS</span><span>{project?`${FJU_PROJECTS.indexOf(project)+1} / 3`:'SEU TALENTO TEM LUGAR'}</span></header>
  <div className="fju-project-content"><div className="fju-project-copy"><h1>{project?.name||'Encontre seu projeto'}</h1><p>{project?.description||'Três caminhos para colocar seus talentos em ação.'}</p>{project&&<p className="fju-project-invitation">{project.invitation}</p>}</div>
  {project?<img className="fju-project-hero" src={project.logo} alt={`Logo ${project.name} FJU`} width="896" height="864"/>:<div className="fju-project-overview">{FJU_PROJECTS.map(p=><div key={p.id}><img src={p.logo} alt={`Logo ${p.name} FJU`}/><span>{p.name}</span></div>)}</div>}</div>
  <footer className="fju-project-route" aria-label="Projetos da unidade"><span className={!project?'is-active':''}>Conheça</span>{FJU_PROJECTS.map(p=><span key={p.id} className={project?.id===p.id?'is-active':''} style={{'--chapter-color':p.color} as React.CSSProperties}><i aria-hidden="true"/>{p.name}</span>)}</footer>
 </section>;
}
