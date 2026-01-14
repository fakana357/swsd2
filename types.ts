
export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

export interface DieResult {
  id: string;
  type: DieType;
  max: number;
  value: number;
  isCrit: boolean;
  multiplier: number;
  isRerolled?: boolean;
  originalValue?: number;
}

export enum RollMode {
  NORMAL = 'Normal',
  ADVANTAGE = 'Advantage',
  DISADVANTAGE = 'Disadvantage'
}

export enum DifficultyLevel {
  TRIVIAL = 'd8',
  EASY = 'd12',
  NORMAL = 'd20',
  CHALLENGE = 'd20 + d4',
  HARD = 'd20 + d4 + d6',
  VERY_HARD = 'd20 + d4 + d6 + d8',
  EXCEPTIONALLY_HARD = 'd20 + d4 + d6 + d8 + d10',
  ALMOST_IMPOSSIBLE = 'd20 + d4 + d6 + d8 + d10 + d12'
}

export interface RollSummary {
  id: string;
  timestamp: number;
  label: string;
  baseSum: number;
  totalMultiplier: number;
  finalTotal: number;
  dice: DieResult[];
  mode: RollMode;
  tensionDice?: DieResult[];
  sourceTab: 'hero' | 'master' | 'combat' | 'aim' | 'armor' | 'evade' | 'custom';
}

export interface ArmorRollResult {
  incomingDamage: number;
  divisor: number;
  finalDamage: number;
  dice: DieResult[];
}

export type DicePool = Record<DieType, number>;