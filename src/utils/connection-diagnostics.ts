export type DiagnosticStatus='pending'|'running'|'ok'|'fail'|'skipped';
export interface DiagnosticStep {id:string;name:string;status:DiagnosticStatus;detail?:string}
export const diagnosticSteps=():DiagnosticStep[]=>[
 {id:'bc',name:'Janelas deste navegador',status:'pending'},
 {id:'db',name:'Gravar e ler dados locais',status:'pending'},
 {id:'signal',name:'Servidor de sinalização',status:'pending'},
 {id:'echo',name:'WebRTC local com confirmação',status:'pending'}
];
function bounded<T>(work:(resolve:(value:T)=>void,reject:(reason:Error)=>void)=>void,signal:AbortSignal,ms=8000):Promise<T>{
 return new Promise((resolve,reject)=>{
  let done=false;
  const finish=(error?:unknown,value?:T)=>{if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',abort);error?reject(error):resolve(value as T);};
  const abort=()=>finish(new Error('Diagnóstico cancelado.'));
  const timer=setTimeout(()=>finish(new Error('O teste não respondeu no prazo.')),ms);
  signal.addEventListener('abort',abort,{once:true});
  if(signal.aborted){abort();return;}
  try{work(value=>finish(undefined,value),error=>finish(error));}catch(error){finish(error);}
 });
}
export async function runConnectionDiagnostics(onStep:(id:string,status:DiagnosticStatus,detail:string)=>void,createPeer:()=>any,signal:AbortSignal){
 let failures=0;let latencyMs:number|undefined;
 const check=async(id:string,task:()=>Promise<string>)=>{
  signal.throwIfAborted();onStep(id,'running','Verificando…');
  try{const detail=await task();signal.throwIfAborted();onStep(id,'ok',detail);return true;}
  catch(error){if(signal.aborted)throw error;failures++;onStep(id,'fail',error instanceof Error?error.message:'Não foi possível verificar.');return false;}
 };
 await check('bc',async()=>{
  const name=`holylink-diagnostic-${crypto.randomUUID()}`;let rx:BroadcastChannel|undefined,tx:BroadcastChannel|undefined;
  try{const start=performance.now();await bounded<void>((resolve)=>{rx=new BroadcastChannel(name);tx=new BroadcastChannel(name);rx.onmessage=event=>{if(event.data==='ping')rx!.postMessage('pong');};tx.onmessage=event=>{if(event.data==='pong')resolve();};tx.postMessage('ping');},signal,2000);return `Mensagem confirmada em ${Math.max(1,Math.round(performance.now()-start))} ms neste navegador.`;}
  finally{rx?.close();tx?.close();}
 });
 await check('db',async()=>{
  const name=`holylink-diagnostic-${crypto.randomUUID()}`;let db:IDBDatabase|undefined;let expired=false;
  try{await bounded<void>((resolve,reject)=>{
   const request=indexedDB.open(name,1);request.onupgradeneeded=()=>request.result.createObjectStore('scratch');
   request.onerror=()=>reject(new Error('Armazenamento local indisponível.'));
   request.onsuccess=()=>{db=request.result;if(expired){db.close();indexedDB.deleteDatabase(name);return;}
    const write=db.transaction('scratch','readwrite');const bytes=new Uint8Array([72,111,108,121,76,105,110,107]);write.objectStore('scratch').put(new Blob([bytes]),'probe');
    write.onabort=()=>reject(new Error('O navegador recusou a gravação.'));
    write.oncomplete=()=>{if(expired)return;const read=db!.transaction('scratch','readonly').objectStore('scratch').get('probe');read.onerror=()=>reject(new Error('A leitura falhou.'));read.onsuccess=()=>{const blob=read.result;if(!(blob instanceof Blob)){reject(new Error('Dados locais não conferem.'));return;}blob.arrayBuffer().then(buffer=>{const actual=new Uint8Array(buffer);if(actual.length!==bytes.length||actual.some((value,index)=>value!==bytes[index]))reject(new Error('Dados locais não conferem.'));else resolve();},()=>reject(new Error('A leitura falhou.')));};};
   };
  },signal,3000);return 'Gravação e leitura conferidas em banco temporário separado das suas mídias.';}
  finally{expired=true;db?.close();indexedDB.deleteDatabase(name);}
 });
 let receiver:any,sender:any,rxConn:any,txConn:any;
 try{
  const connected=await check('signal',async()=>{
   receiver=createPeer();await bounded<void>((resolve,reject)=>{receiver.on('open',()=>resolve());receiver.on('error',()=>reject(new Error('Não foi possível acessar o servidor de sinalização.')));},signal);
   return 'Este navegador acessou o servidor. Isso não confirma a rede do outro aparelho.';
  });
  if(!connected){onStep('echo','skipped','Depende do servidor de sinalização.');}
  else await check('echo',async()=>{
   const nonce=crypto.randomUUID();const bytes=crypto.getRandomValues(new Uint8Array(16384));
   latencyMs=await bounded<number>((resolve,reject)=>{
    const fail=()=>reject(new Error('O canal WebRTC foi interrompido.'));
    receiver.on('connection',(conn:any)=>{rxConn=conn;conn.on('error',fail);conn.on('data',(data:any)=>{if(data?.type==='HOLY_DIAGNOSTIC_ECHO'&&data.nonce===nonce)conn.send(data);});});
    sender=createPeer();sender.on('error',fail);receiver.on('error',fail);
    sender.on('open',()=>{
     txConn=sender.connect(receiver.id);txConn.on('error',fail);txConn.on('close',fail);let start=0;
     txConn.on('open',()=>{start=performance.now();txConn.send({type:'HOLY_DIAGNOSTIC_ECHO',nonce,bytes});});
     txConn.on('data',(data:any)=>{if(data?.type!=='HOLY_DIAGNOSTIC_ECHO'||data.nonce!==nonce)return;
      const actual=data.bytes instanceof ArrayBuffer?new Uint8Array(data.bytes):data.bytes;
      if(!(actual instanceof Uint8Array)||actual.length!==bytes.length||actual.some((value:number,index:number)=>value!==bytes[index])){reject(new Error('Os dados retornados não conferem.'));return;}
      resolve(Math.max(1,Math.round(performance.now()-start)));
     });
    });
   },signal);
   return `16 KB enviados, retornados e conferidos neste aparelho · ida e volta ${latencyMs} ms.`;
  });
 }finally{txConn?.close();rxConn?.close();sender?.destroy();receiver?.destroy();}
 return {success:failures===0,latencyMs,message:failures?'Há verificações com falha. Confira os detalhes; uma falha não invalida os testes aprovados.':'Verificações locais concluídas. Teste também o controle no celular e confira o telão; este diagnóstico não confirma HDMI, reprodução de vídeo ou a rede entre aparelhos.'};
}
