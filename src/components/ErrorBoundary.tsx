import React, { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showConfirmReset: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showConfirmReset: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showConfirmReset: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="holy-theme holy-error-screen min-h-screen bg-hl-panel text-hl-copy flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-hl-panel border border-hl-line rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-center animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 self-center">
              <AlertOctagon className="w-6 h-6" />
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-lg font-bold text-white">Ops, algo deu errado!</h1>
              <p className="text-xs text-hl-muted leading-relaxed">
                Ocorreu um erro inesperado na renderização do aplicativo. Você pode tentar recarregar ou limpar o cache local.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-black/40 border border-hl-line rounded-lg p-3 max-h-32 overflow-y-auto font-mono text-[10px] text-hl-dim leading-normal scrollbar-thin">
                <span className="text-red-400 font-bold block mb-1">Detalhes do Erro:</span>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-1 whitespace-pre-wrap text-hl-dim">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {this.state.showConfirmReset ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col gap-3">
                <p className="text-xs text-red-300 font-semibold">
                  Confirma redefinir as configurações para o padrão de fábrica? Dados salvos localmente serão limpos.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => this.setState({ showConfirmReset: false })}
                    className="flex-1 py-2 rounded-lg bg-hl-raised hover:bg-hl-raised text-white text-xs font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={this.handleClearAndReload}
                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30"
                  >
                    Sim, Redefinir
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full mt-2">
                <button
                  onClick={this.handleReload}
                  className="w-full bg-hl-gold hover:bg-hl-gold-bright text-black text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recarregar Página
                </button>

                <button
                  onClick={() => this.setState({ showConfirmReset: true })}
                  className="text-hl-dim hover:text-hl-soft text-[10px] underline cursor-pointer transition-all mt-1"
                >
                  Limpar Configurações e Recarregar
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
