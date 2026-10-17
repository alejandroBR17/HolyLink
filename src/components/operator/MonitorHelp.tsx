import {useState} from 'react';
import {ConsoleGroupTitle} from './ConsoleIntro';
import {Gauge,Monitor,Smartphone,Keyboard,RefreshCw,HardDrive,SlidersHorizontal,EyeOff,Volume2,ShieldCheck} from '../ui/icons';
import type {DetailedHardwareReport} from '../../utils/performance';
interface Props {fps:number;mode:string;report:DetailedHardwareReport|null;blackout:boolean;clear:boolean;onBlackout:()=>void;onClear:()=>void;onConnection:()=>void;onSettings:()=>void;onShortcuts:()=>void;onPerformance:()=>void;onClearCache:()=>void;cacheCleared:boolean}
const modeNames:Record<string,string>={light:'Leve',balanced:'Equilibrado',high:'Detalhado'};
export function MonitorHelp(p:Props){
 const[guide,setGuide]=useState<'pc'|'phone'>(()=>localStorage.getItem('projection_deviceRole')==='phone'?'phone':'pc');
 return <details className="holy-disclosure console-settings-group monitor-help"><summary><ConsoleGroupTitle icon={Gauge} title="Ajuda de projeção e diagnóstico" description="Prepare os aparelhos, resolva problemas e confira o desempenho local."/></summary><div className="monitor-help-body">
  <section className="monitor-help-guide" aria-labelledby="monitor-guide-title"><header><ShieldCheck size={23}/><div><span className="operator-eyebrow">Antes da reunião</span><h3 id="monitor-guide-title">Prepare cada aparelho</h3><p>Escolher um guia não altera a função do aparelho.</p></div></header>
   <div className="monitor-help-tabs" role="group" aria-label="Guia de projeção"><button aria-pressed={guide==='pc'} onClick={()=>setGuide('pc')}><Monitor size={21}/>PC no telão</button><button aria-pressed={guide==='phone'} onClick={()=>setGuide('phone')}><Smartphone size={21}/>Celular no controle</button></div>
   <ol>{(guide==='pc'?[
    ['Estenda a tela','Conecte o HDMI e escolha estender, nas configurações de tela do computador.'],
    ['Abra a projeção','Use Abrir telão no topo e mova a janela para a segunda tela. Se não abrir, permita janelas para este site.'],
    ['Confira antes de começar','Veja um texto e uma mídia no telão. O Monitor é uma composição local, sem confirmação física do HDMI.']
   ]:[
    ['Abra o mesmo endereço','No PC, escolha PC da projeção em Conexão. No celular, abra o mesmo endereço do HolyLink.'],
    ['Autorize o controle','Leia o QR ou informe o código, compare a confirmação e permita no PC. Marque lembrar para facilitar a próxima conexão.'],
    ['Envie quando precisar','Conectar não copia arquivos. Use Enviar para o PC para mesclar agenda e mídias, e confira no telão.']
   ]).map(([title,text],index)=><li key={title}><span>{index+1}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
   <div className="monitor-help-links"><button onClick={p.onConnection}><Smartphone size={18}/>Ir para Conexão</button><button onClick={p.onShortcuts}><Keyboard size={18}/>Atalhos e comandos</button></div>
  </section>
  <section className="monitor-help-troubleshooting" aria-labelledby="monitor-problems-title"><span className="operator-eyebrow">Durante o uso</span><h3 id="monitor-problems-title">O que você precisa resolver?</h3>
   <details><summary><EyeOff size={20}/><span>O telão está preto ou sem conteúdo</span></summary><div><p>Confira a entrada HDMI, a janela na segunda tela e a imagem diretamente no telão.</p>{p.blackout&&<div className="monitor-help-warning"><p>Blackout está ativo neste operador.</p><button onClick={p.onBlackout}>Retirar blackout</button></div>}{p.clear&&<div className="monitor-help-warning"><p>Limpar tela está ocultando o conteúdo da fila.</p><button onClick={p.onClear}>Mostrar conteúdo da fila</button></div>}{!p.blackout&&!p.clear&&<p>Blackout e Limpar tela estão desligados. Confira também a janela de projeção, a passagem ou o cronômetro em exibição.</p>}</div></details>
   <details><summary><Volume2 size={20}/><span>O vídeo está sem som</span></summary><div><p>A prévia do Monitor é sempre silenciosa. No PC da projeção, confira o volume do HolyLink, o som da mídia e a saída de áudio do sistema.</p><button onClick={p.onSettings}>Abrir ajustes de áudio</button></div></details>
   <details><summary><Smartphone size={20}/><span>O celular não está controlando o PC</span></summary><div><p>Confira os aparelhos autorizados e a conexão. O teste de rede em Conexão verifica este navegador; faça também um comando no celular e confira o PC.</p><button onClick={p.onConnection}>Abrir conexão e teste de rede</button></div></details>
   <details><summary><Gauge size={20}/><span>A imagem está travando</span></summary><div><p>Pause a prévia local para reduzir o trabalho deste aparelho. Para o telão, abra os ajustes de desempenho no próprio PC da projeção e experimente um perfil mais leve.</p><button onClick={p.onPerformance}>Ver desempenho deste aparelho</button></div></details>
  </section>
  <section className="monitor-help-performance" aria-labelledby="monitor-performance-title"><header><Gauge size={23}/><div><span className="operator-eyebrow">Medições locais</span><h3 id="monitor-performance-title">Este aparelho agora</h3><p>Não mede o PC conectado nem garante fluidez no telão.</p></div></header>
   <dl><div><dt>Atualizações da aba</dt><dd>{Math.round(p.fps)} FPS</dd><small>Amostra contínua do navegador</small></div><div><dt>Perfil em uso</dt><dd>{modeNames[p.mode]||'Não informado'}</dd><small>Qualidade dos efeitos locais</small></div><div><dt>RAM aproximada</dt><dd>{p.report?.ramDisplay||'Não informada'}</dd><small>Informada ou limitada pelo navegador</small></div></dl>
   <div className="monitor-help-links"><button className="monitor-help-primary" onClick={p.onPerformance}><SlidersHorizontal size={19}/>Diagnóstico e qualidade</button><button onClick={p.onClearCache}><HardDrive size={19}/>Limpar pré-carregamento</button></div>
   <p className="monitor-help-footnote">A limpeza descarta recursos temporários de pré-carregamento. Não apaga mídias, roteiro ou autorizações.</p>{p.cacheCleared&&<p className="monitor-help-feedback" role="status"><RefreshCw size={17}/>Pré-carregamento limpo. Seus arquivos foram preservados.</p>}
  </section>
 </div></details>;
}
