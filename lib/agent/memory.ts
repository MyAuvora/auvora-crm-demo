/**
 * AI Agent Memory System
 * Stores preferences, action outcomes, and learning signals
 */

export interface AgentPreference {
  key: string;
  value: any;
  updatedAt: string;
}

export interface ActionOutcome {
  id: string;
  actionType: string;
  params: any;
  accepted: boolean;
  executedAt?: string;
  result?: any;
  userFeedback?: string;
}

export interface AgentMemory {
  preferences: AgentPreference[];
  actionHistory: ActionOutcome[];
  learningSignals: {
    promoSuccessRates: Map<string, number>;
    messageResponseRates: Map<string, number>;
    bestSendTimes: Map<string, string>;
  };
}

const MEMORY_KEY = 'auvora-agent-memory';

/**
 * Get agent memory from storage
 */
export function getAgentMemory(): AgentMemory {
  if (typeof window === 'undefined') {
    return {
      preferences: [],
      actionHistory: [],
      learningSignals: {
        promoSuccessRates: new Map(),
        messageResponseRates: new Map(),
        bestSendTimes: new Map(),
      },
    };
  }

  const stored = localStorage.getItem(MEMORY_KEY);
  if (!stored) {
    return {
      preferences: [],
      actionHistory: [],
      learningSignals: {
        promoSuccessRates: new Map(),
        messageResponseRates: new Map(),
        bestSendTimes: new Map(),
      },
    };
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      preferences: parsed.preferences || [],
      actionHistory: parsed.actionHistory || [],
      learningSignals: {
        promoSuccessRates: new Map(Object.entries(parsed.learningSignals?.promoSuccessRates || {})),
        messageResponseRates: new Map(Object.entries(parsed.learningSignals?.messageResponseRates || {})),
        bestSendTimes: new Map(Object.entries(parsed.learningSignals?.bestSendTimes || {})),
      },
    };
  } catch (e) {
    console.error('Failed to parse agent memory:', e);
    return {
      preferences: [],
      actionHistory: [],
      learningSignals: {
        promoSuccessRates: new Map(),
        messageResponseRates: new Map(),
        bestSendTimes: new Map(),
      },
    };
  }
}

/**
 * Save agent memory to storage
 */
export function saveAgentMemory(memory: AgentMemory): void {
  if (typeof window === 'undefined') return;

  const toStore = {
    preferences: memory.preferences,
    actionHistory: memory.actionHistory,
    learningSignals: {
      promoSuccessRates: Object.fromEntries(memory.learningSignals.promoSuccessRates),
      messageResponseRates: Object.fromEntries(memory.learningSignals.messageResponseRates),
      bestSendTimes: Object.fromEntries(memory.learningSignals.bestSendTimes),
    },
  };

  localStorage.setItem(MEMORY_KEY, JSON.stringify(toStore));
}

/**
 * Set a preference
 */
export function setPreference(key: string, value: any): void {
  const memory = getAgentMemory();
  const existing = memory.preferences.find(p => p.key === key);
  
  if (existing) {
    existing.value = value;
    existing.updatedAt = new Date().toISOString();
  } else {
    memory.preferences.push({
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  }

  saveAgentMemory(memory);
}

/**
 * Get a preference
 */
export function getPreference(key: string, defaultValue?: any): any {
  const memory = getAgentMemory();
  const pref = memory.preferences.find(p => p.key === key);
  return pref ? pref.value : defaultValue;
}

/**
 * Record action outcome
 */
export function recordActionOutcome(outcome: ActionOutcome): void {
  const memory = getAgentMemory();
  memory.actionHistory.push(outcome);

  if (memory.actionHistory.length > 100) {
    memory.actionHistory = memory.actionHistory.slice(-100);
  }

  saveAgentMemory(memory);
}

/**
 * Get action acceptance rate
 */
export function getActionAcceptanceRate(actionType: string): number {
  const memory = getAgentMemory();
  const actions = memory.actionHistory.filter(a => a.actionType === actionType);
  
  if (actions.length === 0) return 0.5; // Default 50%
  
  const accepted = actions.filter(a => a.accepted).length;
  return accepted / actions.length;
}

/**
 * Update learning signal
 */
export function updateLearningSignal(
  type: 'promo' | 'message' | 'sendTime',
  key: string,
  value: number | string
): void {
  const memory = getAgentMemory();

  if (type === 'promo') {
    memory.learningSignals.promoSuccessRates.set(key, value as number);
  } else if (type === 'message') {
    memory.learningSignals.messageResponseRates.set(key, value as number);
  } else if (type === 'sendTime') {
    memory.learningSignals.bestSendTimes.set(key, value as string);
  }

  saveAgentMemory(memory);
}

/**
 * Get learning signal
 */
export function getLearningSignal(
  type: 'promo' | 'message' | 'sendTime',
  key: string
): number | string | undefined {
  const memory = getAgentMemory();

  if (type === 'promo') {
    return memory.learningSignals.promoSuccessRates.get(key);
  } else if (type === 'message') {
    return memory.learningSignals.messageResponseRates.get(key);
  } else if (type === 'sendTime') {
    return memory.learningSignals.bestSendTimes.get(key);
  }

  return undefined;
}

/**
 * Clear agent memory (for testing/reset)
 */
export function clearAgentMemory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MEMORY_KEY);
}
