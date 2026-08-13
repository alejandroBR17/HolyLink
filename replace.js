import fs from 'fs';
let code = fs.readFileSync('src/components/operator/ControlsPanel.tsx', 'utf8');

const target = `  return (
    <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] border border-white/10 flex flex-col gap-5">
      <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between flex-wrap gap-2 drop-shadow-md">
        <h3 className="text-zinc-300 font-extrabold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
          <Gauge className="w-4 h-4 text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
          Desempenho & Anti-Travamento
        </h3>
        <span className={\`text-[8px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] \${
          effectiveMode === 'light' 
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
            : effectiveMode === 'balanced'
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }\`}>
          {effectiveMode === 'light' 
             ? (isDetectedLowPerf ? '⚡ Leve (Lag Detectado)' : '⚡ Modo Leve (Anti-Lag)') 
             : effectiveMode === 'balanced'
            ? '⚖️ Modo Equilibrado'
            : '🟢 Alta Qualidade'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-zinc-950/80 border border-zinc-800/80 p-3 rounded-xl flex flex-col justify-between shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]">
          <span className="text-[9px] text-zinc-500 font-bold uppercase">Taxa FPS</span>
          <span className={\`font-mono font-bold text-xs mt-0.5 \${fps < 38 ? 'text-amber-400' : 'text-emerald-400'}\`}>{fps} FPS</span>
        </div>
        <div className="bg-zinc-950/80 border border-zinc-800/80 p-3 rounded-xl flex flex-col justify-between shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]">
          <span className="text-[9px] text-zinc-500 font-bold uppercase">CPU Cores</span>
          <span className="font-mono font-bold text-xs text-zinc-300 mt-0.5">{hardwareConcurrency} Cores</span>
        </div>
        <div className="bg-zinc-950/80 border border-zinc-800/80 p-3 rounded-xl flex flex-col justify-between shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]">
          <span className="text-[9px] text-zinc-500 font-bold uppercase">Memória RAM</span>
          <span className="font-mono font-bold text-xs text-blue-400 mt-0.5 truncate" title={report?.ramDisplay || 'RAM Identificada'}>
            {report?.ramDisplay || (report?.ramGB ? \`\${report.ramGB} GB\` : '>= 4 GB')}
          </span>
        </div>
        <div className="bg-zinc-950/80 border border-zinc-800/80 p-3 rounded-xl flex flex-col justify-between shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]">
          <span className="text-[9px] text-zinc-500 font-bold uppercase">Heap JS</span>
          <span className="font-mono font-bold text-xs text-purple-400 mt-0.5 truncate">
            {report?.jsHeapUsedMB ? \`\${report.jsHeapUsedMB} MB\` : 'Ativo'}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-zinc-950/80 border border-zinc-800/80 p-3 rounded-xl text-[10px] leading-relaxed text-zinc-400 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
        <div>
          {effectiveMode === 'light' ? (
            <span><strong>Modo Leve (Anti-Lag):</strong> Otimizado para máxima fluidez, sem efeitos visuais pesados.</span>
          ) : effectiveMode === 'balanced' ? (
            <span><strong>Modo Equilibrado:</strong> Transições suaves mantendo baixo uso de memória e GPU.</span>
          ) : (
            <span><strong>Alta Qualidade:</strong> Efeitos visuais completos, desfoques e partículas ativas.</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
        <button
          onClick={handlePurgeRam}
          className={\`relative overflow-hidden w-full py-2.5 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 \${
            ramCleared 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[inset_0_2px_8px_rgba(16,185,129,0.2)]' 
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05)] active:translate-y-[1px] active:shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)]'
          }\`}
        >
          {!ramCleared && <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-xl opacity-50" />}
          <HardDrive className={\`w-3.5 h-3.5 relative z-10 \${ramCleared ? 'text-emerald-400 animate-bounce' : 'text-blue-400 drop-shadow-[0_0_4px_rgba(96,165,250,0.5)]'}\`} />
          <span className="relative z-10">{ramCleared ? '✓ Memória Cache Liberada!' : 'Limpar Memória RAM'}</span>
        </button>

        <button
          onClick={handleToggleWakeLock}
          disabled={!wakeLockSupported}
          className={\`relative overflow-hidden w-full py-2.5 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 \${
            wakeLockActive
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[inset_0_2px_8px_rgba(16,185,129,0.2)]'
              : wakeLockSupported
              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05)] active:translate-y-[1px] active:shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)]'
              : 'bg-zinc-950 border-zinc-800/50 text-zinc-600 cursor-not-allowed'
          }\`}
          title={wakeLockSupported ? 'Impedir hibernação do navegador durante transmissão' : 'Wake Lock não suportado pelo navegador'}
        >
          {wakeLockSupported && !wakeLockActive && <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-xl opacity-50" />}
          <Monitor className={\`w-3.5 h-3.5 \${wakeLockActive ? 'text-emerald-400' : 'text-amber-500'}\`} />
          <span className="relative z-10">{wakeLockActive ? '🟢 Tela Acesa (Wake Lock)' : wakeLockSupported ? 'Activar Tela Acesa' : 'Wake Lock Indisponível'}</span>
        </button>
      </div>
    </div>`;

const replacement = `  return (
    <div className="relative bg-[#09090b] border border-[#27272a] rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.03)] overflow-hidden flex flex-col gap-5 group">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="relative z-10 border-b border-[#333] pb-3 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-zinc-400 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-1.5">
          <Gauge className="w-4 h-4 text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
          Desempenho & Hardware
        </h3>
        <span className={\`text-[8px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider border shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] \${
          effectiveMode === 'light' 
            ? 'bg-amber-950/80 border-amber-900/50 text-amber-500' 
            : effectiveMode === 'balanced'
            ? 'bg-blue-950/80 border-blue-900/50 text-blue-400'
            : 'bg-emerald-950/80 border-emerald-900/50 text-emerald-400'
        }\`}>
          {effectiveMode === 'light' 
             ? (isDetectedLowPerf ? '[!] Leve (Lag)' : '[!] Modo Leve') 
             : effectiveMode === 'balanced'
            ? '[=] Equilibrado'
            : '[+] Alta Qualidade'}
        </span>
      </div>

      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-[#030303] border border-[#222] p-3 rounded-lg flex flex-col justify-between shadow-[inset_0_2px_10px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"></div>
          <span className="text-[8px] font-mono text-zinc-600 uppercase">Sys.FPS</span>
          <span className={\`font-mono font-bold text-sm mt-1 \${fps < 38 ? 'text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]' : 'text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]'}\`}>{fps}</span>
        </div>
        <div className="bg-[#030303] border border-[#222] p-3 rounded-lg flex flex-col justify-between shadow-[inset_0_2px_10px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"></div>
          <span className="text-[8px] font-mono text-zinc-600 uppercase">CPU.Cores</span>
          <span className="font-mono font-bold text-sm text-cyan-500 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)] mt-1">{hardwareConcurrency}</span>
        </div>
        <div className="bg-[#030303] border border-[#222] p-3 rounded-lg flex flex-col justify-between shadow-[inset_0_2px_10px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"></div>
          <span className="text-[8px] font-mono text-zinc-600 uppercase">SYS.RAM</span>
          <span className="font-mono font-bold text-sm text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)] mt-1 truncate" title={report?.ramDisplay || 'RAM Identificada'}>
            {report?.ramDisplay || (report?.ramGB ? \`\${report.ramGB}G\` : '>=4G')}
          </span>
        </div>
        <div className="bg-[#030303] border border-[#222] p-3 rounded-lg flex flex-col justify-between shadow-[inset_0_2px_10px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"></div>
          <span className="text-[8px] font-mono text-zinc-600 uppercase">JS.Heap</span>
          <span className="font-mono font-bold text-sm text-purple-500 drop-shadow-[0_0_5px_rgba(168,85,247,0.8)] mt-1 truncate">
            {report?.jsHeapUsedMB ? \`\${report.jsHeapUsedMB}M\` : 'OK'}
          </span>
        </div>
      </div>

      <div className="relative z-10 flex items-start gap-3 bg-[#111113] border border-[#222] p-3 rounded-lg text-[10px] font-mono leading-relaxed text-zinc-400 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500 mt-0.5" />
        <div>
          {effectiveMode === 'light' ? (
            <span><strong className="text-amber-500">ANTI-LAG:</strong> Otimizado para máxima fluidez, ignorando efeitos GPU pesados.</span>
          ) : effectiveMode === 'balanced' ? (
            <span><strong className="text-blue-500">EQUILÍBRIO:</strong> Transições suaves com gerenciamento inteligente de GPU.</span>
          ) : (
            <span><strong className="text-emerald-500">ALTA QUALIDADE:</strong> Desfoques e partículas ativas. Sistema em capacidade total.</span>
          )}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
        <button
          onClick={handlePurgeRam}
          className={\`relative overflow-hidden w-full py-2.5 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 \${
            ramCleared 
              ? 'bg-[#111113] border-emerald-900/50 text-emerald-500 shadow-[inset_0_2px_8px_rgba(16,185,129,0.1)]' 
              : 'bg-gradient-to-b from-[#1c1c1f] to-[#121214] border-[#333] hover:border-[#444] text-zinc-300 shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] active:translate-y-[2px] active:shadow-[inset_0_3px_8px_rgba(0,0,0,0.8)]'
          }\`}
        >
          <HardDrive className={\`w-3.5 h-3.5 relative z-10 \${ramCleared ? 'text-emerald-500 animate-pulse' : 'text-zinc-500'}\`} />
          <span className="relative z-10">{ramCleared ? '✓ Cache Liberado' : 'Limpar Cache (Purge)'}</span>
        </button>

        <button
          onClick={handleToggleWakeLock}
          disabled={!wakeLockSupported}
          className={\`relative overflow-hidden w-full py-2.5 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 \${
            wakeLockActive
              ? 'bg-[#111113] border-emerald-900/50 text-emerald-500 shadow-[inset_0_2px_8px_rgba(16,185,129,0.1)]'
              : wakeLockSupported
              ? 'bg-gradient-to-b from-[#1c1c1f] to-[#121214] border-[#333] hover:border-[#444] text-zinc-300 shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)] active:translate-y-[2px] active:shadow-[inset_0_3px_8px_rgba(0,0,0,0.8)]'
              : 'bg-[#09090b] border-[#222] text-zinc-700 cursor-not-allowed'
          }\`}
          title={wakeLockSupported ? 'Impedir hibernação do navegador durante transmissão' : 'Wake Lock não suportado'}
        >
          <Monitor className={\`w-3.5 h-3.5 relative z-10 \${wakeLockActive ? 'text-emerald-500' : 'text-zinc-500'}\`} />
          <span className="relative z-10">{wakeLockActive ? 'Wake Lock: Ativo' : wakeLockSupported ? 'Ativar Wake Lock' : 'Não Suportado'}</span>
        </button>
      </div>
    </div>`;

fs.writeFileSync('src/components/operator/ControlsPanel.tsx', code.replace(target, replacement));
console.log('Replaced PerformanceControlModule');
