import React, { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    if (window.confirm("Isso redefinirá as configurações do aplicativo para o padrão de fábrica para resolver o travamento. Deseja continuar?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-center animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 self-center">
              <AlertOctagon className="w-6 h-6" />
            </div>
            
            <div className="flex flex-col gap-2">
              <h1 className="text-lg font-bold text-white">Ops, algo deu errado!</h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ocorreu um erro inesperado na renderização do aplicativo. Você pode tentar recarregar ou limpar o cache local.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-black/40 border border-zinc-800 rounded-lg p-3 max-h-32 overflow-y-auto font-mono text-[10px] text-zinc-500 leading-normal scrollbar-thin">
                <span className="text-red-400 font-bold block mb-1">Detalhes do Erro:</span>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-1 whitespace-pre-wrap text-zinc-600">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 w-full mt-2">
              <button
                onClick={this.handleReload}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </button>
              
              <button
                onClick={this.handleClearAndReload}
                className="text-zinc-500 hover:text-zinc-300 text-[10px] underline cursor-pointer transition-all mt-1"
              >
                Limpar Configurações e Recarregar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
