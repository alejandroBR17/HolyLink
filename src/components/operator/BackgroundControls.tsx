import React, {useState} from 'react';
import {Waves, Wind, CircleDot, Sparkles, CircleOff, WandSparkles, Eye, Gauge} from 'lucide-react';
import {ThreeBackground3D, type BackgroundStyleOption} from '../ThreeBackground3D';
import {ParticlesBackground} from '../ParticlesBackground';
const styles = [
  {id:'auto',label:'Automático',description:'Aurora na reunião; aura no encontro jovem.',icon:WandSparkles},
  {id:'aurora',label:'Aurora',description:'Luz dourada em movimento.',icon:Waves},
  {id:'veil',label:'Véu',description:'Ondas suaves como tecido.',icon:Wind},
  {id:'fju_aura',label:'Aura',description:'Luz e energia ao redor do centro.',icon:CircleDot},
  {id:'particles_2d',label:'Partículas 2D',description:'Pontos de luz com movimento leve.',icon:Sparkles},
  {id:'off',label:'Sem efeito',description:'Desliga a camada animada do fundo.',icon:CircleOff},
] as const;
export function BackgroundControls({style,fps,intensity,update}: {style:BackgroundStyleOption; fps:30|60; intensity:'high'|'medium'|'low'; update:(key:string,value:unknown)=>void}) {
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState<'active'|'unavailable'>('active');
  const [compatible, setCompatible] = useState(false);
  return <section className="ambience-controls" aria-labelledby="ambience-title">
    <div className="operator-section-heading"><div><span className="operator-eyebrow"><Waves size={16}/>Atmosfera da projeção</span><h3 id="ambience-title">Fundos e movimento</h3><p>Escolha o visual. Os ajustes são enviados ao PC conectado.</p></div></div>
    <div className="ambience-options" role="group" aria-label="Estilo do fundo">{styles.map(item => <button key={item.id} aria-pressed={style === item.id} onClick={() => {setStatus('active'); update('background3DStyle',item.id);}}><item.icon size={21}/><span><strong>{item.label}</strong><small>{item.description}</small></span></button>)}</div>
    <div className="ambience-tuning">
      <label><Gauge size={16}/>Limite da animação<select aria-label="Limite da animação" disabled={style === 'off' || style === 'particles_2d'} value={fps} onChange={e => update('background3DFps',Number(e.target.value))}><option value={30}>30 FPS · menor consumo</option><option value={60}>60 FPS · mais fluidez</option></select></label>
      <label>Intensidade e detalhe<select aria-label="Intensidade e detalhe" disabled={style === 'off' || style === 'particles_2d'} value={intensity} onChange={e => update('background3DIntensity',e.target.value)}><option value="low">Leve</option><option value="medium">Média</option><option value="high">Alta</option></select></label>
    </div>
    <p className="operator-muted">FPS é um limite, não uma garantia. Partículas 2D têm movimento próprio. A qualidade geral deste aparelho fica em Desempenho.</p>
    <details className="bible-picker ambience-preview" onToggle={e => setPreview(e.currentTarget.open)}><summary><Eye size={17}/>Conferir efeito neste aparelho · 16:9</summary>
      {preview && <><div className="ambience-preview-frame" data-style={style}>
        <ThreeBackground3D stylePreset={style} fpsLimit={fps} intensity={intensity} onStatus={setStatus} compatible={compatible}/><ParticlesBackground disabled={style !== 'particles_2d'}/>
        <div className="ambience-preview-caption"><span>Prévia do fundo</span><strong>{styles.find(item => item.id === style)?.label}</strong></div>
      </div>{style !== 'off' && style !== 'particles_2d' && <button className="ambience-compatible-toggle" aria-pressed={compatible} onClick={() => setCompatible(v => !v)}>{compatible ? 'Voltar à prévia 3D' : 'Usar prévia leve neste aparelho'}</button>}<p role="status" className="operator-notice">{style === 'off' ? 'Camada animada desligada. As imagens e os vídeos da fila continuam.' : compatible && style !== 'particles_2d' ? 'Prévia leve selecionada. Demonstra o ambiente sem 3D e não altera a renderização do PC.' : status === 'unavailable' && style !== 'particles_2d' ? 'Versão animada compatível: o 3D não pôde renderizar neste aparelho. O PC pode usar o 3D normalmente.' : 'Prévia local do efeito, sem trocar o slide. Automático mostra Aurora aqui.'}</p><p className="operator-muted">Fotos e vídeos em tela cheia podem cobrir o fundo no telão. Confira a composição na aba Monitor.</p></>}
    </details>
  </section>;
}
