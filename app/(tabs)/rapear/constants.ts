import type { SessionTimeOption, SessionTypeOption } from './types';

export const SESSION_TIMES: SessionTimeOption[] = [
  { key: '1-min', label: '1 min', description: 'Ronda rápida' },
  { key: '2-min', label: '2 min', description: 'Formato clásico' },
  { key: '5-min', label: '5 min', description: 'Sesión extensa' },
];

export const TRAINING_TIME: SessionTimeOption[] = [
  { key: 'infinite', label: '∞', description: 'Sin límite de tiempo', icon: 'all-inclusive' },
];

export const SESSION_TYPES: SessionTypeOption[] = [
  { key: 'record', label: 'Grabar' },
  { key: 'train', label: 'Entrenar' },
];

export const PRE_RECORD_COUNTDOWN_SECONDS = 5;
export const VIEW_TOP_OFFSET = 12;
