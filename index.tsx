import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  History, 
  RotateCcw, 
  X, 
  Dices, 
  User, 
  Crown, 
  ChevronRight, 
  Flame, 
  Sword, 
  Shield, 
  Minus, 
  Plus, 
  Wind, 
  Target, 
  Save, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';

// ==========================================
// 1. TYPES
// ==========================================

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

export type DicePool = Record<DieType, number>;

interface StatPreset {
  baseDie: DieType;
  bonusDie: DieType | 'none';
}

// ==========================================
// 2. LOGIC & UTILS
// ==========================================

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

// ==========================================
// 3. COMPONENTS
// ==========================================

interface DieIconProps {
  type: DieType;
  value?: number;
  isCrit?: boolean;
  isRerolled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const DieIcon: React.FC<DieIconProps> = ({ 
  type, value, isCrit, isRerolled, size = 'md', className = '' 
}) => {
  const getPath = (t: DieType) => {
    switch (t) {
      case 'd4': return "M12 1 L22 19 L2 19 Z";
      case 'd6': return "M4 4 h16 v16 h-16 Z";
      case 'd8': return "M12 4 L19 8 L19 16 L12 20 L5 16 L5 8 Z";
      case 'd10': return "M12 2 L22 12 L12 22 L2 12 Z";
      case 'd12': return "M12 2 L22 9 L18 21 L6 21 L2 9 Z";
      case 'd20': return "M12 2 L20.66 7 L20.66 17 L12 22 L3.34 17 L3.34 7 Z";
      default: return "M3 3h18v18H3z";
    }
  };

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizes = {
    xs: 'text-[8px]',
    sm: 'text-xs',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl',
  };

  const labelSizeClasses = {
    xs: 'hidden',
    sm: 'text-[7px]',
    md: 'text-[8px]',
    lg: 'text-[9px]',
    xl: 'text-[11px]',
  };

  const getDieColor = () => {
    if (isCrit) return 'text-red-500 fill-red-950/60';
    if (isRerolled) return 'text-yellow-400 fill-yellow-950/40';
    return 'text-zinc-500 fill-zinc-900/80 shadow-2xl';
  };

  return (
    <div className={`relative flex flex-col items-center transition-all duration-200 ${className}`}>
      <span className={`mb-0.5 font-black text-white/30 tracking-[0.1em] uppercase ${labelSizeClasses[size]}`}>
        {type}
      </span>
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 24 24" className={`${sizeClasses[size]} ${getDieColor()}`} stroke="currentColor" strokeWidth="1.5">
          <path d={getPath(type)} />
        </svg>
        {value !== undefined && (
          <span className={`absolute inset-0 flex items-center justify-center font-saga font-bold leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
            isCrit ? 'text-white' : (isRerolled ? 'text-yellow-300' : 'text-zinc-100')
          } ${textSizes[size]}`}>
            {value}
          </span>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN APPLICATION
// ==========================================

const STATS = [
  { id: 'STR', label: 'Strength', activeBg: 'bg-red-600' },
  { id: 'DEX', label: 'Dexterity', activeBg: 'bg-green-600' },
  { id: 'MAS', label: 'Mastery', activeBg: 'bg-yellow-600' },
  { id: 'KNO', label: 'Knowledge', activeBg: 'bg-blue-600' },
  { id: 'RAP', label: 'Rapport', activeBg: 'bg-purple-600' },
  { id: 'MEN', label: 'Menace', activeBg: 'bg-cyan-600' },
  { id: 'INT', label: 'Introversion', activeBg: 'bg-orange-600' },
];

const App: React.FC = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'hero' | 'master' | 'combat' | 'aim' | 'armor' | 'evade'>('hero');
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<RollSummary[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Overlay Management
  const [activeOverlay, setActiveOverlay] = useState<'base' | 'bonus' | 'difficulty' | null>(null);

  // General Staging
  const [rollMode, setRollMode] = useState<RollMode>(RollMode.NORMAL);
  const [surgeDiceCount, setSurgeDiceCount] = useState(0);

  // Armor State
  const [incomingDamage, setIncomingDamage] = useState(0);
  const [armorDie, setArmorDie] = useState<DieType>('d8');
  const [armorCharges, setArmorCharges] = useState(1);

  // Evade State
  const [aimResult, setAimResult] = useState(0);
  const [evadePool, setEvadePool] = useState<DicePool>({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0 });

  // Aim State
  const [aimPool, setAimPool] = useState<DicePool>({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0 });

  // Results State
  const [lastRoll, setLastRoll] = useState<RollSummary | null>(null);
  const [lastMasterRoll, setLastMasterRoll] = useState<RollSummary | null>(null);

  // Resolution Setup
  const [baseDie, setBaseDie] = useState<DieType>('d20');
  const [bonusDie, setBonusDie] = useState<DieType | 'none'>('none');
  const [hasProficiency, setHasProficiency] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.NORMAL);

  // Stat Presets
  const [activeStat, setActiveStat] = useState<string | null>(null);
  const [presets, setPresets] = useState<Record<string, StatPreset>>({});

  // Combat State
  const [dicePool, setDicePool] = useState<DicePool>({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0 });

  // --- INITIALIZATION ---
  useEffect(() => {
    const saved = localStorage.getItem('swordsaga_presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load presets", e);
      }
    }
  }, []);

  // --- COMPUTED ---
  const isDirty = useMemo(() => {
    if (!activeStat) return false;
    const current = presets[activeStat] || { baseDie: 'd20', bonusDie: 'none' };
    return baseDie !== current.baseDie || bonusDie !== current.bonusDie;
  }, [activeStat, presets, baseDie, bonusDie]);

  // --- ACTIONS ---

  const saveCurrentPreset = () => {
    if (!activeStat) return;
    const newPresets = {
      ...presets,
      [activeStat]: { baseDie, bonusDie }
    };
    setPresets(newPresets);
    localStorage.setItem('swordsaga_presets', JSON.stringify(newPresets));
  };

  const handleStatClick = (statId: string) => {
    if (activeStat === statId) {
      setActiveStat(null);
      setBaseDie('d20');
      setBonusDie('none');
      return;
    }
    setActiveStat(statId);
    const p = presets[statId] || { baseDie: 'd20', bonusDie: 'none' };
    setBaseDie(p.baseDie);
    setBonusDie(p.bonusDie);
  };

  const clearStaged = () => {
    setDicePool({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0 });
    setEvadePool({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0 });
    setAimPool({ d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0 });
    setSurgeDiceCount(0);
    setLastRoll(null);
    setLastMasterRoll(null);
    setRollMode(RollMode.NORMAL);
    setArmorCharges(1);
    setIncomingDamage(0);
    setAimResult(0);
    setActiveStat(null);
    setBaseDie('d20');
    setBonusDie('none');
    setHasProficiency(false);
  };

  const executeHardReset = () => {
    localStorage.removeItem('swordsaga_presets');
    setPresets({});
    setHistory([]);
    clearStaged();
    setShowHistory(false);
    setShowResetConfirm(false);
  };

  const handleRoll = useCallback(async (label: string, isMasterRoll: boolean = false) => {
    setIsRolling(true);

    let typesToRoll: DieType[] = [];
    const sourceTab = isMasterRoll ? 'master' : activeTab;
    
    if (activeTab === 'hero' && !isMasterRoll) {
      typesToRoll.push(baseDie);
      if (bonusDie !== 'none') typesToRoll.push(bonusDie);
      if (hasProficiency) typesToRoll.push('d6');
      for (let i = 0; i < surgeDiceCount; i++) typesToRoll.push('d6');
    } else if (activeTab === 'master' || isMasterRoll) {
      typesToRoll = getDifficultyDice(difficulty);
    } else if (activeTab === 'combat') {
      Object.entries(dicePool).forEach(([type, count]) => {
        for (let i = 0; i < (count as number); i++) typesToRoll.push(type as DieType);
      });
      for (let i = 0; i < surgeDiceCount; i++) typesToRoll.push('d6');
    } else if (activeTab === 'aim') {
      Object.entries(aimPool).forEach(([type, count]) => {
        for (let i = 0; i < (count as number); i++) typesToRoll.push(type as DieType);
      });
      for (let i = 0; i < surgeDiceCount; i++) typesToRoll.push('d6');
    } else if (activeTab === 'armor') {
      for (let i = 0; i < armorCharges; i++) typesToRoll.push(armorDie);
      for (let i = 0; i < surgeDiceCount; i++) typesToRoll.push('d6');
    } else if (activeTab === 'evade') {
      Object.entries(evadePool).forEach(([type, count]) => {
        for (let i = 0; i < (count as number); i++) typesToRoll.push(type as DieType);
      });
      for (let i = 0; i < surgeDiceCount; i++) typesToRoll.push('d6');
    }

    if (typesToRoll.length === 0) {
      setIsRolling(false);
      return;
    }

    const effectiveMode = (activeTab === 'armor') ? RollMode.NORMAL : rollMode;
    const results = rollDiceSet(typesToRoll, effectiveMode);
    const calculated = calculateRoll(results);

    const summary: RollSummary = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      label: isMasterRoll || activeTab === 'master' ? `Master: ${difficulty}` : label,
      dice: results,
      ...calculated,
      mode: effectiveMode,
      sourceTab: sourceTab as any
    };

    if (isMasterRoll || activeTab === 'master') {
      setLastMasterRoll(summary);
    } else {
      setLastRoll(summary);
    }

    setHistory(prev => [summary, ...prev].slice(0, 30));
    setIsRolling(false);
  }, [activeTab, baseDie, bonusDie, hasProficiency, surgeDiceCount, difficulty, dicePool, aimPool, evadePool, rollMode, armorDie, armorCharges]);

  const addTension = (isPlayer: boolean) => {
    const target = isPlayer ? lastRoll : lastMasterRoll;
    if (!target) return;

    const tensionResult = rollDiceSet(['d6'], RollMode.NORMAL)[0];
    const multiplier = tensionResult.value === 6 ? 3 : tensionResult.value;

    const updated: RollSummary = {
      ...target,
      totalMultiplier: target.totalMultiplier * multiplier,
      finalTotal: target.finalTotal * multiplier,
      tensionDice: [...(target.tensionDice || []), tensionResult]
    };

    if (isPlayer) setLastRoll(updated);
    else setLastMasterRoll(updated);
  };

  const updateDicePool = (pool: DicePool, setter: React.Dispatch<React.SetStateAction<DicePool>>, type: DieType, delta: number) => {
    setter(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta)
    }));
  };

  const getDynamicSize = (count: number): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
    if (count <= 2) return 'xl';
    if (count <= 4) return 'lg';
    if (count <= 8) return 'md';
    if (count <= 20) return 'sm';
    return 'xs';
  };

  const ActionFooter = ({ label, onRoll, color, disabled = false, showSurge = true }: { label: string, onRoll: () => void, color: string, disabled?: boolean, showSurge?: boolean }) => (
    <div className="absolute bottom-0 left-0 w-full h-24 flex gap-3 px-3 z-10 bg-zinc-900 pt-2 pb-2 border-t border-zinc-800">
      <button 
        onClick={() => setShowHistory(true)}
        className="flex-1 h-20 bg-zinc-800 border-2 border-zinc-700 rounded-[1.25rem] flex flex-col items-center justify-center active:bg-zinc-700 active:border-zinc-500 shadow-lg transition-all active:scale-95 group"
      >
        <History className="w-6 h-6 text-zinc-400 group-active:text-white" />
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-1 group-active:text-white">History</span>
      </button>

      <button 
        onClick={onRoll}
        disabled={disabled}
        className={`flex-[2.5] h-20 ${color} disabled:bg-zinc-800/50 text-white font-black text-lg uppercase tracking-[0.25em] rounded-[1.25rem] shadow-2xl border-b-4 transition-transform active:scale-95 active:brightness-125`}
        style={{ borderBottomColor: 'rgba(0,0,0,0.3)' }}
      >
        {label}
      </button>

      {showSurge && (
        <button 
          onClick={() => setSurgeDiceCount(prev => prev + 1)}
          className={`flex-1 h-20 rounded-[1.25rem] border-2 transition-all duration-75 flex flex-col items-center justify-center shadow-xl active:scale-90 active:bg-yellow-400 active:border-yellow-100 active:shadow-[0_0_50px_rgba(250,204,21,0.8)] group overflow-hidden relative ${surgeDiceCount > 0 ? 'bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'bg-zinc-950 border-zinc-800'}`}
        >
          <div className="absolute inset-0 bg-yellow-400 opacity-0 group-active:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
             <span className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 group-active:text-black transition-colors ${surgeDiceCount > 0 ? 'text-yellow-500' : 'text-zinc-600'}`}>Surge</span>
             <span className={`font-saga text-5xl leading-none transition-colors group-active:text-black ${surgeDiceCount > 0 ? 'text-white' : 'text-zinc-500'}`}>
               {surgeDiceCount}
             </span>
          </div>
        </button>
      )}
    </div>
  );

  const FortuneModeSelector = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex flex-col gap-2">
      <span className={`text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2 ${compact ? 'text-[9px]' : ''}`}>Fortune Mode</span>
      <div className="grid grid-cols-3 gap-3">
        {[
          { mode: RollMode.NORMAL, label: 'Normal', color: 'border-zinc-800 bg-zinc-900/40 text-zinc-500', activeColor: 'bg-zinc-800 border-zinc-400 text-white shadow-zinc-800/50' },
          { mode: RollMode.ADVANTAGE, label: 'Advantage', color: 'border-emerald-900/30 bg-emerald-950/10 text-emerald-800', activeColor: 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-900/50' },
          { mode: RollMode.DISADVANTAGE, label: 'Disadvantage', color: 'border-rose-900/30 bg-rose-950/10 text-rose-800', activeColor: 'bg-rose-600 border-rose-400 text-white shadow-rose-900/50' },
        ].map(m => (
          <button 
            key={m.mode} 
            onClick={() => setRollMode(m.mode)}
            className={`${compact ? 'h-14 rounded-2xl' : 'h-20 rounded-3xl'} border-2 flex flex-col items-center justify-center shadow-xl transition-all active:scale-95 ${rollMode === m.mode ? m.activeColor : m.color}`}
          >
            <span className={`font-black uppercase tracking-[0.1em] text-center px-1 leading-tight ${compact ? 'text-[9px]' : 'text-[11px]'}`}>{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const FullScreenSelector = ({ 
    title, onClose, onSelect, options, layout = 'grid' 
  }: { title: string, onClose: () => void, onSelect: (val: any) => void, options: any[], layout?: 'grid' | 'list' }) => (
    <div className="fixed inset-0 bg-black z-[300] p-6 flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <h3 className="font-saga text-3xl text-zinc-100 uppercase tracking-widest">{title}</h3>
        <button onClick={onClose} className="p-4 bg-zinc-900 rounded-full text-zinc-400 active:scale-90 transition-transform"><X className="w-8 h-8" /></button>
      </div>
      <div className={`overflow-y-auto no-scrollbar flex-grow pb-10 ${layout === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-4'}`}>
        {options.map((opt, i) => (
          <button 
            key={i}
            onClick={() => { onSelect(opt.value); onClose(); }}
            className={`flex items-center gap-6 p-8 rounded-[2.5rem] border-2 border-zinc-800 bg-zinc-900/40 active:bg-zinc-800 active:border-zinc-500 transition-all active:scale-95 shadow-xl ${layout === 'list' ? 'justify-between' : 'flex-col justify-center text-center'}`}
          >
            {opt.icon && <opt.icon className="w-8 h-8 text-blue-500" />}
            {opt.die && <div className="font-saga text-5xl text-blue-500">{opt.die}</div>}
            <div className="flex flex-col">
              <span className="text-xl font-black text-zinc-100 uppercase tracking-widest">{opt.label}</span>
              {opt.notation && <span className="text-[12px] text-zinc-500 font-black uppercase tracking-widest mt-1">{opt.notation}</span>}
            </div>
            {layout === 'list' && <ChevronRight className="w-8 h-8 text-zinc-700" />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-saga-gradient overflow-hidden select-none">
      
      {/* 1. CINEMATIC DISPLAY */}
      <div className="flex-grow relative flex flex-col items-center justify-center p-2 border-b border-zinc-800/40 overflow-hidden">
        {!lastRoll && !lastMasterRoll ? (
          <div className="text-center">
             <h2 className="font-saga text-2xl text-zinc-700 uppercase tracking-[0.4em] font-black">SwordSaga</h2>
             <div className="h-px w-16 bg-zinc-800 mx-auto my-4 opacity-30" />
             <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.5em]">Forge your legend</p>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
             <div className="flex w-full max-w-5xl items-center justify-center gap-4 px-2">
                {lastRoll && (
                   <div className="flex-1 flex justify-center">
                      <div className="flex flex-col items-center w-full">
                        <div className="flex flex-wrap justify-center gap-x-2 gap-y-2 mb-1 max-h-[110px] overflow-y-auto no-scrollbar py-1 content-center w-full">
                          {lastRoll.dice.map((d) => (
                            <DieIcon key={d.id} type={d.type} value={d.value} isCrit={d.isCrit} isRerolled={d.isRerolled} size={getDynamicSize(lastRoll.dice.length)} />
                          ))}
                        </div>
                        <div className="text-center">
                          {lastRoll.sourceTab === 'armor' ? (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-6 mb-1">
                                <div className="text-2xl font-black text-zinc-500 line-through opacity-50">{incomingDamage || 0}</div>
                                <div className="text-zinc-700 font-saga text-xl">/ {lastRoll.finalTotal}</div>
                              </div>
                              <div className="text-8xl font-saga text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.4)] mb-1">{Math.round((incomingDamage || 0) / Math.max(1, lastRoll.finalTotal))}</div>
                            </div>
                          ) : lastRoll.sourceTab === 'evade' ? (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-6 mb-1 text-zinc-500 font-black uppercase tracking-widest text-[10px]"><span>Aim: {aimResult}</span><span>Roll: {lastRoll.finalTotal}</span></div>
                                <div className={`text-8xl font-saga ${lastRoll.finalTotal >= aimResult ? 'text-green-500' : 'text-red-500'} mb-1`}>{lastRoll.finalTotal >= aimResult ? 'DODGED' : 'HIT'}</div>
                                <div className="flex flex-col items-center mt-0.5"><div className="text-xl font-black text-white">Total: {lastRoll.finalTotal}</div></div>
                              </div>
                          ) : (
                            <div className="flex flex-col items-center"><div className={`${['combat', 'aim'].includes(lastRoll.sourceTab) ? 'text-9xl' : 'text-7xl'} font-saga text-white mb-2`}>{lastRoll.finalTotal}</div></div>
                          )}
                          <div className="mt-0.5 text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border text-blue-400 bg-blue-500/10 border-blue-500/20">{lastRoll.sourceTab === 'armor' ? 'Final Damage' : lastRoll.sourceTab === 'evade' ? 'Evasion Resolve' : lastRoll.sourceTab === 'aim' ? 'Aim Result' : 'Hero Result'}</div>
                          <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-1 opacity-60">({lastRoll.baseSum} × {lastRoll.totalMultiplier.toFixed(1)}x)</div>
                          
                          {/* Tension Dice - Only show for hero/master */}
                          {['hero', 'master'].includes(lastRoll.sourceTab) && (
                            <div className="flex flex-col items-center">
                              <div className="flex flex-wrap justify-center gap-2 mt-1 min-h-[30px]">
                                {lastRoll.tensionDice?.map((t, i) => (
                                  <div key={i} className="flex flex-col items-center"><div className="bg-red-600/30 border border-red-500/40 rounded-xl px-3 py-1 flex items-center justify-center shadow-lg"><span className="text-[12px] font-black text-red-500">x{t.value === 6 ? 3 : t.value}</span></div></div>
                                ))}
                              </div>
                              <button onClick={() => addTension(true)} className="mt-1 bg-zinc-900 border-2 border-zinc-800 px-8 py-1.5 rounded-full text-zinc-400 hover:text-red-500 transition-all uppercase font-black text-[11px] flex items-center gap-3 mx-auto active:scale-90 shadow-2xl"><Flame className="w-4 h-4" /> Tension</button>
                            </div>
                          )}
                        </div>
                      </div>
                   </div>
                )}
                {lastRoll && lastMasterRoll && !['armor', 'evade', 'aim'].includes(activeTab) && (
                   <div className="flex flex-col items-center justify-center px-1">
                      <div className="text-zinc-800 font-saga text-xl opacity-30 mb-1">VS</div>
                      <div className={`font-saga uppercase text-[9px] px-3 py-1.5 rounded-full shadow-2xl border transition-all tracking-widest ${lastRoll.finalTotal >= lastMasterRoll.finalTotal ? 'bg-green-600 border-green-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>{lastRoll.finalTotal >= lastMasterRoll.finalTotal ? 'WIN' : 'LOSS'}</div>
                   </div>
                )}
                {lastMasterRoll && !['evade', 'armor', 'aim'].includes(activeTab) && (
                   <div className="flex-1 flex justify-center">
                      <div className="flex flex-col items-center w-full">
                        <div className="flex flex-wrap justify-center gap-x-2 gap-y-2 mb-1 max-h-[110px] overflow-y-auto no-scrollbar py-1 content-center w-full">
                          {lastMasterRoll.dice.map((d) => (
                            <DieIcon key={d.id} type={d.type} value={d.value} isCrit={d.isCrit} isRerolled={d.isRerolled} size={getDynamicSize(lastMasterRoll.dice.length)} />
                          ))}
                        </div>
                        <div className="text-center">
                          <div className="flex flex-col items-center"><div className="text-7xl font-saga text-white mb-2">{lastMasterRoll.finalTotal}</div></div>
                          <div className="mt-0.5 text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border text-red-400 bg-red-500/10 border-blue-500/20">Master Result</div>
                          <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-1 opacity-60">({lastMasterRoll.baseSum} × {lastMasterRoll.totalMultiplier.toFixed(1)}x)</div>
                          <div className="flex flex-wrap justify-center gap-2 mt-1 min-h-[30px]">
                            {lastMasterRoll.tensionDice?.map((t, i) => (
                              <div key={i} className="flex flex-col items-center"><div className="bg-red-600/30 border border-red-500/40 rounded-xl px-3 py-1 flex items-center justify-center shadow-lg"><span className="text-[12px] font-black text-red-500">x{t.value === 6 ? 3 : t.value}</span></div></div>
                            ))}
                          </div>
                          <button onClick={() => addTension(false)} className="mt-1 bg-zinc-900 border-2 border-zinc-800 px-8 py-1.5 rounded-full text-zinc-400 hover:text-red-500 transition-all uppercase font-black text-[11px] flex items-center gap-3 mx-auto active:scale-90 shadow-2xl"><Flame className="w-4 h-4" /> Tension</button>
                        </div>
                      </div>
                   </div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* 2. CONTROL PANEL */}
      <div className="h-[62vh] bg-zinc-900 p-5 flex flex-col border-t border-zinc-800 shadow-2xl relative overflow-hidden">
        
        {/* Navigation */}
        <div className="flex gap-4 mb-4 flex-none">
          <div className="flex-grow grid grid-cols-3 gap-1.5 bg-black/60 p-1 rounded-2xl border border-zinc-800/30">
            {[
              { id: 'hero', label: 'Hero', icon: User, color: 'text-blue-500' },
              { id: 'master', label: 'Master', icon: Crown, color: 'text-red-500' },
              { id: 'combat', label: 'Combat', icon: Sword, color: 'text-orange-500' },
              { id: 'aim', label: 'Aim', icon: Target, color: 'text-yellow-500' },
              { id: 'armor', label: 'Armor', icon: Shield, color: 'text-green-500' },
              { id: 'evade', label: 'Evade', icon: Wind, color: 'text-cyan-500' },
            ].map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setRollMode(RollMode.NORMAL); }} className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-600'}`}>
                <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? tab.color : 'text-zinc-700'}`} /><span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={clearStaged} className="p-4 bg-zinc-800 border-2 border-zinc-700 rounded-2xl text-zinc-200 active:bg-red-900/30 transition-colors" title="Reset Current Roll"><RotateCcw className="w-8 h-8" /></button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-grow relative flex flex-col overflow-hidden">
          
          {activeTab === 'hero' && (
            <div className="h-full flex flex-col">
              <div className="flex-grow overflow-y-auto no-scrollbar pb-24 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setActiveOverlay('base')} className="h-28 bg-zinc-950 border-2 border-zinc-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-1 shadow-lg active:border-blue-500 active:scale-95 transition-transform">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Base</span>
                    <span className="text-4xl font-saga text-blue-500 leading-none">{baseDie}</span>
                  </button>
                  <button onClick={() => setActiveOverlay('bonus')} className="h-28 bg-zinc-950 border-2 border-zinc-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-1 shadow-lg active:border-blue-500 active:scale-95 transition-transform">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Bonus</span>
                    <span className="text-4xl font-saga text-blue-500 leading-none">{bonusDie === 'none' ? '--' : bonusDie}</span>
                  </button>
                  <button onClick={() => setHasProficiency(!hasProficiency)} className={`flex flex-col items-center justify-center w-full h-28 rounded-[2.5rem] border-2 ${hasProficiency ? 'bg-blue-600/10 border-blue-500' : 'bg-zinc-950 border-zinc-800'} active:scale-95 transition-all`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest mb-3 ${hasProficiency ? 'text-blue-400' : 'text-zinc-600'}`}>Prof.</span>
                    <div className={`w-14 h-7 rounded-full p-1 ${hasProficiency ? 'bg-blue-600' : 'bg-zinc-800'}`}><div className={`w-5 h-5 bg-white rounded-full transition-transform ${hasProficiency ? 'translate-x-7' : 'translate-x-0'}`} /></div>
                  </button>
                </div>
                <FortuneModeSelector />
                
                {/* Stat Presets Grid */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Character Stat Presets</span>
                  <div className="grid grid-cols-4 gap-2">
                    {STATS.map(stat => (
                      <button 
                        key={stat.id} 
                        onClick={() => handleStatClick(stat.id)} 
                        className={`h-12 rounded-xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 ${activeStat === stat.id ? `${stat.activeBg} border-white/40 text-white shadow-lg` : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                      >
                        <span className="text-[9px] font-black uppercase tracking-tight text-center px-0.5 leading-none">{stat.label}</span>
                      </button>
                    ))}
                    <button 
                      onClick={saveCurrentPreset} 
                      disabled={!isDirty} 
                      className={`h-12 rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all duration-300 ${!isDirty ? 'bg-zinc-900 border-zinc-800 text-zinc-700 opacity-50' : 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)] active:scale-95 cursor-pointer'}`}
                    >
                      <Save className={`w-3.5 h-3.5 ${isDirty ? 'animate-pulse' : ''}`} />
                      <span className="text-[10px] font-black uppercase tracking-tight">Save</span>
                    </button>
                  </div>
                </div>
              </div>
              <ActionFooter label="ROLL" color="bg-blue-600" onRoll={() => handleRoll('Heroic Resolve')} />
            </div>
          )}

          {activeTab === 'master' && (
            <div className="h-full flex flex-col">
              <div className="flex-grow overflow-y-auto no-scrollbar pb-32 space-y-4">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Master's Will Difficulty</span>
                <div className="grid grid-cols-2 gap-3 h-auto min-h-[280px]">
                  {[
                    { val: DifficultyLevel.TRIVIAL, label: 'Trivial' },
                    { val: DifficultyLevel.EASY, label: 'Easy' },
                    { val: DifficultyLevel.NORMAL, label: 'Normal' },
                    { val: DifficultyLevel.CHALLENGE, label: 'Challenge' },
                    { val: DifficultyLevel.HARD, label: 'Hard' },
                    { val: DifficultyLevel.VERY_HARD, label: 'Very Hard' },
                    { val: DifficultyLevel.EXCEPTIONALLY_HARD, label: 'Ex. Hard' },
                    { val: DifficultyLevel.ALMOST_IMPOSSIBLE, label: 'Impossible' },
                  ].map((lvl) => (
                    <button key={lvl.val} onClick={() => setDifficulty(lvl.val)} className={`flex flex-col items-center justify-center py-4 px-2 rounded-[1.5rem] border-2 transition-all active:scale-95 ${difficulty === lvl.val ? 'bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{lvl.label}</span>
                      <span className="font-saga text-sm opacity-80">{lvl.val}</span>
                    </button>
                  ))}
                </div>
              </div>
              <ActionFooter label="ROLL" color="bg-red-600" onRoll={() => handleRoll('Master Challenge', true)} showSurge={false} />
            </div>
          )}

          {activeTab === 'combat' && (
            <div className="h-full flex flex-col">
              <div className="flex-grow overflow-y-auto no-scrollbar pb-32 space-y-6">
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(DIE_MAP) as DieType[]).map(type => (
                    <button 
                      key={type} 
                      onClick={() => updateDicePool(dicePool, setDicePool, type, 1)} 
                      className={`rounded-2xl h-24 flex flex-row items-center justify-center gap-4 shadow-lg active:scale-95 transition-all border-2 ${dicePool[type] > 0 ? 'bg-orange-600/20 border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.3)]' : 'bg-zinc-950 border-zinc-800'}`}
                    >
                      <span className={`text-[14px] font-black uppercase tracking-widest ${dicePool[type] > 0 ? 'text-orange-400' : 'text-orange-500/60'}`}>{type}</span>
                      <span className={`font-saga text-6xl leading-none ${dicePool[type] > 0 ? 'text-white' : 'text-zinc-500'}`}>{dicePool[type]}</span>
                    </button>
                  ))}
                </div>
                <FortuneModeSelector />
              </div>
              <ActionFooter label="ROLL" color="bg-orange-600" onRoll={() => handleRoll('Combat Assault')} />
            </div>
          )}

          {activeTab === 'aim' && (
            <div className="h-full flex flex-col">
              <div className="flex-grow overflow-y-auto no-scrollbar pb-32 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(DIE_MAP) as DieType[]).map(type => (
                    <button 
                      key={type} 
                      onClick={() => updateDicePool(aimPool, setAimPool, type, 1)} 
                      className={`rounded-2xl h-24 flex flex-row items-center justify-center gap-4 shadow-lg active:scale-95 transition-all border-2 ${aimPool[type] > 0 ? 'bg-yellow-600/20 border-yellow-500 shadow-[0_0_15px_rgba(202,138,4,0.3)]' : 'bg-zinc-950 border-zinc-800'}`}
                    >
                      <span className={`text-[14px] font-black uppercase tracking-widest ${aimPool[type] > 0 ? 'text-yellow-400' : 'text-yellow-500/60'}`}>{type}</span>
                      <span className={`font-saga text-6xl leading-none ${aimPool[type] > 0 ? 'text-white' : 'text-zinc-500'}`}>{aimPool[type]}</span>
                    </button>
                  ))}
                </div>
                <FortuneModeSelector />
              </div>
              <ActionFooter label="AIM" color="bg-yellow-600" onRoll={() => handleRoll('Aiming for the Mark')} />
            </div>
          )}

          {activeTab === 'armor' && (
            <div className="h-full flex flex-col">
              <div className="flex-grow overflow-y-auto no-scrollbar pb-32 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 border-2 border-zinc-800 rounded-[2rem] p-5 h-36 flex flex-col justify-center"><span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest mb-1">Incoming DMG</span><input type="number" inputMode="numeric" value={incomingDamage || ''} onChange={(e) => setIncomingDamage(parseInt(e.target.value) || 0)} placeholder="0" className="bg-transparent text-5xl font-saga text-red-500 focus:outline-none w-full appearance-none m-0" /></div>
                  <div className="bg-black/40 border-2 border-zinc-800 rounded-[2rem] p-5 h-36 flex flex-col justify-center items-center">
                    <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest mb-3">Charges</span>
                    <div className="flex items-center justify-between w-full px-2">
                      <button onClick={() => setArmorCharges(Math.max(1, armorCharges - 1))} className="w-14 h-14 bg-zinc-800 border-2 border-zinc-700 rounded-2xl active:bg-red-900/40 flex items-center justify-center shadow-lg transition-transform active:scale-90"><Minus className="w-8 h-8 text-zinc-300" /></button><span className="text-5xl font-saga text-green-500">{armorCharges}</span><button onClick={() => setArmorCharges(armorCharges + 1)} className="w-14 h-14 bg-zinc-800 border-2 border-zinc-700 rounded-2xl active:bg-green-900/40 flex items-center justify-center shadow-lg transition-transform active:scale-90"><Plus className="w-8 h-8 text-zinc-300" /></button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(DIE_MAP) as DieType[]).map(type => (
                    <button key={type} onClick={() => setArmorDie(type)} className={`h-20 rounded-[1.5rem] border-2 flex flex-col items-center justify-center transition-all active:scale-95 ${armorDie === type ? 'bg-green-600 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}><span className="text-[13px] font-black uppercase tracking-widest">{type}</span></button>
                  ))}
                </div>
              </div>
              <ActionFooter label="DEFEND" color="bg-green-600" onRoll={() => handleRoll('Armor Defense')} />
            </div>
          )}

          {activeTab === 'evade' && (
            <div className="h-full flex flex-col">
              <div className="flex-grow overflow-y-auto no-scrollbar pb-32 space-y-3">
                <div className="bg-black/40 border-2 border-zinc-800 rounded-[1.5rem] px-5 h-20 flex items-center">
                  <div className="flex flex-col flex-grow"><span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest leading-tight mb-1">Aim To Beat</span><input type="number" inputMode="numeric" value={aimResult || ''} onChange={(e) => setAimResult(parseInt(e.target.value) || 0)} placeholder="0" className="bg-transparent text-4xl font-saga text-cyan-500 focus:outline-none w-full appearance-none m-0" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(DIE_MAP) as DieType[]).map(type => (
                    <button 
                      key={type} 
                      onClick={() => updateDicePool(evadePool, setEvadePool, type, 1)} 
                      className={`rounded-[1.25rem] h-20 flex flex-row items-center justify-center gap-3 shadow-lg active:scale-95 transition-all border-2 ${evadePool[type] > 0 ? 'bg-cyan-600/20 border-cyan-400 shadow-[0_0_15px_rgba(8,145,178,0.3)]' : 'bg-zinc-950 border-zinc-800'}`}
                    >
                      <span className={`text-[16px] font-black uppercase tracking-widest ${evadePool[type] > 0 ? 'text-cyan-400' : 'text-cyan-500/60'}`}>{type}</span>
                      <span className={`font-saga text-6xl leading-none ${evadePool[type] > 0 ? 'text-white' : 'text-zinc-500'}`}>{evadePool[type]}</span>
                    </button>
                  ))}
                </div>
                <div className="pt-2"><FortuneModeSelector compact /></div>
              </div>
              <ActionFooter label="EVADE" color="bg-cyan-600" onRoll={() => handleRoll('Evasive Maneuver')} />
            </div>
          )}

        </div>
      </div>

      {/* OVERLAYS */}
      {activeOverlay === 'base' && (
        <FullScreenSelector title="Base Attribute" onClose={() => setActiveOverlay(null)} onSelect={setBaseDie} options={Object.keys(DIE_MAP).map(d => ({ label: d, value: d, die: d }))} />
      )}
      {activeOverlay === 'bonus' && (
        <FullScreenSelector title="Bonus Attribute" onClose={() => setActiveOverlay(null)} onSelect={setBonusDie} options={[{ label: 'None', value: 'none', icon: X }, ...Object.keys(DIE_MAP).map(d => ({ label: d, value: d, die: d }))]} />
      )}

      {/* CHRONICLES / HISTORY OVERLAY */}
      {showHistory && (
          <div className="fixed inset-0 bg-black z-[400] p-6 flex flex-col">
             <div className="flex justify-between items-center mb-8">
               <h3 className="font-saga text-3xl text-zinc-100 uppercase tracking-widest flex items-center gap-5">
                 <History className="w-10 h-10 text-zinc-500" /> Chronicles
               </h3>
               <button onClick={() => setShowHistory(false)} className="p-4 bg-zinc-900 rounded-full text-zinc-400 active:scale-90 transition-transform">
                 <X className="w-8 h-8" />
               </button>
             </div>

             <div className="flex flex-col flex-grow overflow-hidden">
                <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 ml-2">Recent Deeds</span>
                <div className="space-y-4 overflow-y-auto no-scrollbar flex-grow pb-10">
                   {history.map(item => (
                     <div key={item.id} className="p-6 border-l-4 border-red-600 bg-zinc-900/30 rounded-r-[1.5rem] flex justify-between items-center active:bg-zinc-800/40 shadow-xl">
                       <div className="flex-grow">
                         <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-3">{item.label}</div>
                         <div className="flex flex-wrap gap-x-1.5 gap-y-1.5">
                           {item.dice.slice(0, 12).map((d) => (<DieIcon key={d.id} type={d.type} value={d.value} size="sm" isRerolled={d.isRerolled} />))}
                           {item.dice.length > 12 && <div className="text-[10px] text-zinc-600 self-end ml-1">+ {item.dice.length - 12} more</div>}
                         </div>
                       </div>
                       <div className="text-4xl font-saga text-white ml-6 drop-shadow-lg">{item.finalTotal}</div>
                     </div>
                   ))}
                   {history.length === 0 && (
                     <div className="h-48 flex flex-col items-center justify-center text-zinc-800 opacity-20 gap-4">
                       <History className="w-16 h-16" />
                       <span className="font-saga text-xl uppercase tracking-[0.4em]">Empty Scroll</span>
                     </div>
                   )}
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-center">
                   <button 
                     onClick={() => setShowResetConfirm(true)}
                     className="flex items-center gap-3 px-8 py-4 bg-zinc-950 border border-zinc-800 text-zinc-700 hover:text-red-500 hover:border-red-900/50 transition-all active:scale-95 rounded-2xl group"
                   >
                     <Trash2 className="w-4 h-4 text-zinc-800 group-hover:text-red-600" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Hard Reset App</span>
                   </button>
                </div>
             </div>

             {/* CUSTOM RESET DIALOG */}
             {showResetConfirm && (
               <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
                 <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowResetConfirm(false)} />
                 <div className="relative w-full max-w-sm bg-zinc-900 border-2 border-red-900/50 rounded-[2.5rem] p-8 shadow-[0_0_100px_rgba(220,38,38,0.2)] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
                    <div className="flex flex-col items-center text-center">
                       <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mb-6">
                         <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
                       </div>
                       <h4 className="font-saga text-2xl text-white uppercase tracking-widest mb-4">Hard Reset?</h4>
                       <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest leading-relaxed mb-10">
                         Do you want to hard reset the app?<br/>
                         <span className="text-red-500/60 text-[10px]">ALL PRESETS AND HISTORY WILL BE LOST.</span>
                       </p>
                       <div className="flex flex-col w-full gap-3">
                          <button 
                            onClick={executeHardReset}
                            className="w-full py-5 bg-red-600 rounded-2xl text-white font-black uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl active:bg-red-500"
                          >
                            WIPE DATA
                          </button>
                          <button 
                            onClick={() => setShowResetConfirm(false)}
                            className="w-full py-5 bg-zinc-800 rounded-2xl text-zinc-400 font-black uppercase tracking-[0.3em] active:scale-95 transition-all"
                          >
                            CANCEL
                          </button>
                       </div>
                    </div>
                 </div>
               </div>
             )}
          </div>
      )}
    </div>
  );
};

// ==========================================
// 5. ROOT MOUNTING
// ==========================================

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);