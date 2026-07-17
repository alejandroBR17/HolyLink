import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target_pattern = re.compile(
    r'<div className="flex items-center gap-3 mt-1\.5">.*?<span>Fila Automática</span>\s*</label>\s*</div>', 
    re.DOTALL
)

replacement = """<div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {/* Duration control for images, read-only for videos */}
                            {media.type === 'image' ? (
                              <div className="flex items-center gap-1 bg-stone-950 px-1.5 py-0.5 rounded border border-stone-850">
                                <span className="text-[10px] text-stone-500 font-medium">Tempo:</span>
                                <span className="text-[10px] text-yellow-500 font-bold font-mono">{media.duration / 1000}s</span>
                                <div className="flex flex-col ml-1">
                                  <button
                                    onClick={async () => {
                                      const newDur = Math.max(2000, media.duration + 1000);
                                      const dbItems = await getAllMediaItems();
                                      const target = dbItems.find(item => item.id === media.id);
                                      if (target) {
                                        target.duration = newDur;
                                        await saveMediaItem(target);
                                        updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                                      }
                                    }}
                                    className="text-stone-500 hover:text-stone-300 hover:scale-110 active:scale-95 cursor-pointer leading-none"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const newDur = Math.max(2000, media.duration - 1000);
                                      const dbItems = await getAllMediaItems();
                                      const target = dbItems.find(item => item.id === media.id);
                                      if (target) {
                                        target.duration = newDur;
                                        await saveMediaItem(target);
                                        updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                                      }
                                    }}
                                    className="text-stone-500 hover:text-stone-300 hover:scale-110 active:scale-95 cursor-pointer leading-none"
                                  >
                                    ▼
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-stone-950 px-2 py-0.5 rounded border border-stone-850 text-[10px] text-stone-400 font-medium font-mono">
                                🎬 {(media.duration / 1000).toFixed(1)}s (Completo)
                              </div>
                            )}
                            {/* Toggles */}
                            <div className="flex items-center bg-stone-950 rounded border border-stone-850 overflow-hidden">
                              {media.type === 'video' && (
                                <>
                                  <button 
                                    onClick={async () => {
                                      const dbItems = await getAllMediaItems();
                                      const target = dbItems.find(item => item.id === media.id);
                                      if (target) {
                                        target.videoMuted = !target.videoMuted;
                                        await saveMediaItem(target);
                                        updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                                      }
                                    }}
                                    className={`px-2 py-1 border-r border-stone-850 hover:bg-stone-800 transition-colors cursor-pointer ${media.videoMuted ? 'text-yellow-500 bg-stone-900' : 'text-stone-500'}`}
                                    title={media.videoMuted ? 'Desativar Mudo' : 'Silenciar Vídeo'}
                                  >
                                    {media.videoMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      const dbItems = await getAllMediaItems();
                                      const target = dbItems.find(item => item.id === media.id);
                                      if (target) {
                                        target.unpinOnEnd = !target.unpinOnEnd;
                                        await saveMediaItem(target);
                                        updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                                      }
                                    }}
                                    className={`px-2 py-1 border-r border-stone-850 hover:bg-stone-800 transition-colors cursor-pointer ${media.unpinOnEnd ? 'text-yellow-500 bg-stone-900' : 'text-stone-500'}`}
                                    title={media.unpinOnEnd ? 'Manter fixo ao fim' : 'Desafixar ao fim'}
                                  >
                                    {media.unpinOnEnd ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                                  </button>
                                </>
                              )}
                              <button 
                                onClick={async () => {
                                  const dbItems = await getAllMediaItems();
                                  const target = dbItems.find(item => item.id === media.id);
                                  if (target) {
                                    target.enabledInLoop = !target.enabledInLoop;
                                    await saveMediaItem(target);
                                    updateStateAndBroadcast('mediaUpdateTrigger', Date.now().toString());
                                  }
                                }}
                                className={`px-2 py-1 flex items-center gap-1 hover:bg-stone-800 transition-colors cursor-pointer ${media.enabledInLoop ? 'text-yellow-500 bg-stone-900' : 'text-stone-500'}`}
                                title={media.enabledInLoop ? 'Remover da Fila Automática' : 'Adicionar à Fila Automática'}
                              >
                                <Repeat className="w-3 h-3" />
                                <span className="text-[10px] font-medium hidden sm:inline">Auto</span>
                              </button>
                            </div>
                          </div>"""

if target_pattern.search(content):
    content = target_pattern.sub(replacement, content)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Pattern not found")

