import type { CSSProperties, CanvasHTMLAttributes } from 'react';

export type OrbState =
  | 'working'
  | 'searching'
  | 'solving'
  | 'listening'
  | 'connecting'
  | 'weaving'
  | 'composing'
  | 'breathing'
  | 'shaping';

export type OrbSize = 64 | 20;

export type OrbTheme = 'auto' | 'dark' | 'light';

export interface ThinkingOrbProps
  extends Omit<CanvasHTMLAttributes<HTMLCanvasElement>, 'style'> {
  state?: OrbState;
  size?: OrbSize;
  theme?: OrbTheme;
  speed?: number;
  paused?: boolean;
  label?: string;
  style?: CSSProperties;
  className?: string;
}

export const ORB_STATES: OrbState[] = [
  'working',
  'searching',
  'solving',
  'listening',
  'connecting',
  'weaving',
  'composing',
  'breathing',
  'shaping',
];

export const ORB_STATE_LABELS: Record<OrbState, string> = {
  working: 'Trabajando…',
  searching: 'Buscando…',
  solving: 'Resolviendo…',
  listening: 'Escuchando…',
  connecting: 'Conectando…',
  weaving: 'Tejiendo…',
  composing: 'Componiendo…',
  breathing: 'Pensando…',
  shaping: 'Formando…',
};
