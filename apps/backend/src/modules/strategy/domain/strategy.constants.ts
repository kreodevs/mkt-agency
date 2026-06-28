export type StrategySource = 'auto' | 'manual';
export type SuggestionStatus = 'pending' | 'approved' | 'rejected' | 'applied';
export type StrategyStatus = 'analyzing' | 'ready' | 'applied' | 'failed';

export const SUGGESTION_STATUSES: SuggestionStatus[] = ['pending', 'approved', 'rejected', 'applied'];

export const STRATEGY_STATUSES: StrategyStatus[] = ['analyzing', 'ready', 'applied', 'failed'];

export const STRATEGY_SOURCES: StrategySource[] = ['auto', 'manual'];

export const ACTION_TYPE_LABELS: Record<string, string> = {
  adjust_content: 'Ajustar contenido',
  reallocate_budget: 'Reasignar presupuesto',
  change_strategy: 'Cambiar estrategia',
  pause_channel: 'Pausar canal',
  amplify: 'Amplificar',
};