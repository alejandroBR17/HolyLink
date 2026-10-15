import {useEffect,useState} from 'react';
import {useDialogFocus} from '../hooks/useDialogFocus';
import {Download,ExternalLink,X,Smartphone,Monitor,Share,CheckCircle2,AlertTriangle,Palette,RefreshCw,ChevronDown} from './ui/icons';
import {usePWAInstall} from '../hooks/usePWAInstall';
import {usePWAIcons,type PWAIconType,type PWAIconTheme} from '../hooks/usePWAIcons';
import {createIconDownload} from '../utils/icon-download';
import {AppUpdateNotice} from './AppUpdateNotice';
interface PWAInstallModalProps {isOpen:boolean;onClose:()=>void}
export function PWAInstallModal({isOpen,onClose}:PWAInstallModalProps) {
  const {isInstallable,isInstalled,isInIframe,hasUpdateAvailable,isUpdating,isInstalling,installMessage,triggerInstall,forceAppUpdate}=usePWAInstall();
  const {iconType,setIconType,iconTheme,setIconTheme,downloadUrl,requiresReload,applyIcon}=usePWAIcons();
  const [device,setDevice]=useState<'android'|'ios'|'desktop'>('desktop');
  const [downloading,setDownloading]=useState(false);
  const [downloadError,setDownloadError]=useState('');
  const dialogRef=useDialogFocus(isOpen,onClose);
  useEffect(()=>{
    const ua=navigator.userAgent.toLowerCase();
    setDevice(/iphone|ipad|ipod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)?'ios':/android/.test(ua)?'android':'desktop');
  },[]);
  async function downloadIcon(event:React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();if(downloading)return;
    setDownloading(true);setDownloadError('');
    try {
      const blob=await createIconDownload(iconType,iconTheme);
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=`HolyLink-${iconType}-${iconTheme}.png`;
      document.body.append(link);link.click();link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),60000);
    } catch {setDownloadError('Não foi possível gerar a imagem. Tente novamente com conexão.');}
    finally {setDownloading(false);}
  }
  if(!isOpen)return null;
  return <div className="holy-theme holy-overlay pwa-overlay">
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-label="Aplicativo HolyLink" tabIndex={-1} className="holy-dialog pwa-dialog">
      <div className="pwa-dialog-top"><span>HolyLink no seu aparelho</span><button onClick={onClose} aria-label="Fechar"><X size={22}/></button></div>
      <header className="pwa-app-heading">
        <div className={`pwa-icon-preview pwa-icon-${iconTheme}`}><img src={`/pwa/local-${iconType}-transparent-192.png`} alt="Prévia do ícone HolyLink" width={96} height={96}/></div>
        <div><h2>Aplicativo HolyLink</h2><p>Acesso pela tela inicial, em uma janela própria.</p></div>
      </header>
      {hasUpdateAvailable&&<AppUpdateNotice updating={isUpdating} onUpdate={forceAppUpdate}/>}
      <section className="pwa-install-section" aria-label="Instalar no aparelho">
        {isInstalled?<p className="pwa-install-confirmed"><CheckCircle2 size={24}/><span><strong>App instalado</strong><small>Confirmado neste navegador ou aberto em janela de aplicativo.</small></span></p>:isInIframe?<div className="pwa-install-help"><p>Abra o HolyLink fora desta janela incorporada para instalar.</p><a className="pwa-primary-action" href={window.location.href} target="_blank" rel="noopener noreferrer"><ExternalLink size={20}/>Abrir em outra guia</a></div>:<>
          {isInstallable&&!requiresReload&&<button className="pwa-primary-action" disabled={isInstalling} onClick={()=>{void triggerInstall();}}><Download size={20}/><span>{isInstalling?'Abrindo convite…':'Instalar HolyLink'}</span></button>}
          <div className="pwa-device-tabs" role="group" aria-label="Instruções por dispositivo">{([['android','Android',Smartphone],['ios','iPhone / iPad',Smartphone],['desktop','PC / Mac',Monitor]] as const).map(([id,label,Icon])=><button key={id} onClick={()=>setDevice(id)} aria-pressed={device===id}><Icon size={19}/><span>{label}</span></button>)}</div>
          <div className="pwa-install-help"><h3>{device==='ios'?'No iPhone ou iPad':device==='android'?'No Android':'No computador'}</h3>
            {device==='ios'?<ol><li>Abra no Safari e toque em <strong>Compartilhar</strong> <Share size={17}/>.</li><li>Escolha <strong>Adicionar à Tela de Início</strong>.</li></ol>:device==='android'?<ol><li>Abra diretamente no <strong>Chrome</strong>.</li><li>Use <strong>Instalar HolyLink</strong> quando disponível ou a opção <strong>Instalar aplicativo</strong> no menu de três pontos.</li></ol>:<ol><li>Abra no <strong>Chrome ou Edge</strong>.</li><li>Use o botão de instalar na barra de endereços ou no menu do navegador.</li></ol>}
          </div>
        </>}
        {installMessage&&<p role="status" className="pwa-feedback">{installMessage}</p>}
      </section>
      <details className="pwa-customize">
        <summary><Palette size={21}/><span>Personalizar ícone</span><ChevronDown size={18}/></summary>
        <div className="pwa-customize-body">
          <fieldset><legend>Logotipo</legend><div className="pwa-choice-grid">{([{id:'symbol',label:'Símbolo'},{id:'full',label:'Completo'},{id:'text',label:'Letras'}] as {id:PWAIconType;label:string}[]).map(option=><button key={option.id} onClick={()=>setIconType(option.id)} aria-pressed={iconType===option.id}>{option.label}</button>)}</div></fieldset>
          <fieldset><legend>Fundo da imagem</legend><div className="pwa-choice-grid">{([{id:'dark',label:'Preto'},{id:'light',label:'Branco'},{id:'transparent',label:'Sem fundo'}] as {id:PWAIconTheme;label:string}[]).map(option=><button key={option.id} onClick={()=>setIconTheme(option.id)} aria-pressed={iconTheme===option.id}><span className={`pwa-color-swatch pwa-icon-${option.id}`}/>{option.label}</button>)}</div></fieldset>
          <p className="pwa-note">O sistema define o recorte e a atualização do ícone do app instalado.</p>
        </div>
      </details>
      {requiresReload&&<div className="pwa-apply-choice"><p>Aplique antes de instalar. Recarrega o HolyLink; faça isso fora da projeção.</p><button className="pwa-primary-action" onClick={applyIcon}><RefreshCw size={20}/>Aplicar ícone</button></div>}
      <div className="pwa-image-download"><div><strong>Quer só a imagem?</strong><p>PNG de 512 px. Fundos preto e branco com cantos arredondados.</p></div><a href={downloadUrl} download={`HolyLink-${iconType}-${iconTheme}.png`} onClick={downloadIcon} aria-disabled={downloading}><Download size={19}/><span>{downloading?'Gerando PNG…':'Baixar imagem PNG'}</span></a>{downloadError&&<p role="alert">{downloadError}</p>}</div>
      <p className="pwa-offline-note"><AlertTriangle size={17}/><span>Sem internet, use apenas recursos já carregados. Novas consultas e conexões podem precisar de rede.</span></p>
    </section>
  </div>;
}
