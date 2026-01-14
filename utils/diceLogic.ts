import { DieType, DieResult, RollMode } from '../types.ts';

export const DIE_MAP: Record<DieType, number> = {
  'd4': 4,
  'd6': 6,
  'd8': 8,
  'd10': 10,
  'd12': 12,
  'd20': 20,
};

const rollSingle = (type: DieType): number => {
  return Math.floor(Math.random() * DIE_MAP[type]) + 1;
};

export const rollDiceSet = (
  diceTypes: DieType[], 
  mode: RollMode = RollMode.NORMAL
): DieResult[] => {
  const results: DieResult[] = diceTypes.map((type, index) => {
    const max = DIE_MAP[type];
    let value = rollSingle(type);
    let originalValue: number | undefined;
    let isRerolled = false;

    // Advantage: Reroll all dice with lower than half total value, once.
    if (mode === RollMode.ADVANTAGE && value < (max / 2)) {
      originalValue = value;
      value = rollSingle(type);
      isRerolled = true;
    }

    // Disadvantage: Reroll all dice with higher than half total value, once.
    if (mode === RollMode.DISADVANTAGE && value > (max / 2)) {
      originalValue = value;
      value = rollSingle(type);
      isRerolled = true;
    }

    const isCrit = value === max;
    // Rule of Sword: Any die that crits multiplies total result by half of its max value.
    const multiplier = isCrit ? (max / 2) : 1;

    return {
      id: `${type}-${index}-${Date.now()}-${Math.random()}`,
      type,
      max,
      value,
      isCrit,
      multiplier,
      isRerolled,
      originalValue,
    };
  });

  return results;
};

export const calculateRoll = (dice: DieResult[]) => {
  const baseSum = dice.reduce((acc, d) => acc + d.value, 0);
  const totalMultiplier = dice.reduce((acc, d) => acc * d.multiplier, 1);
  return {
    baseSum,
    totalMultiplier,
    finalTotal: Math.floor(baseSum * totalMultiplier),
  };
};

export const getDifficultyDice = (level: string): DieType[] => {
  switch (level) {
    case 'd8': return ['d8'];
    case 'd12': return ['d12'];
    case 'd20': return ['d20'];
    case 'd20 + d4': return ['d20', 'd4'];
    case 'd20 + d4 + d6': return ['d20', 'd4', 'd6'];
    case 'd20 + d4 + d6 + d8': return ['d20', 'd4', 'd6', 'd8'];
    case 'd20 + d4 + d6 + d8 + d10': return ['d20', 'd4', 'd6', 'd8', 'd10'];
    case 'd20 + d4 + d6 + d8 + d10 + d12': return ['d20', 'd4', 'd6', 'd8', 'd10', 'd12'];
    default: return ['d20'];
  }
};