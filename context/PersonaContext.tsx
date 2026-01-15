
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DigitalTwinPersona, ChatMessage, SimulationResult, SimulationModifiers, ScenarioMode } from '../types';
import type { Chat } from "@google/genai";
import { calculateBaselines } from '../utils/personaAnalytics';

// State container for the Simulator Page persistence
export interface SimulatorState {
  campaignName: string;
  copyA: string;
  copyB: string;
  result: SimulationResult | null;
}

interface PersonaContextType {
  persona: DigitalTwinPersona | null;
  setPersona: (persona: DigitalTwinPersona | null) => void;
  chatSession: Chat | null;
  setChatSession: (chat: Chat | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  simulatorState: SimulatorState;
  setSimulatorState: React.Dispatch<React.SetStateAction<SimulatorState>>;
  
  // NEW: Context Tuner State
  simulationModifiers: SimulationModifiers | null;
  setSimulationModifiers: React.Dispatch<React.SetStateAction<SimulationModifiers | null>>;
  resetModifiers: () => void;
  applyModifiers: (newModifiers: SimulationModifiers, customMessage?: string) => void;
  
  // NEW: Global Scenario Mode
  scenarioMode: ScenarioMode;
  setScenarioMode: (mode: ScenarioMode) => void;
  
  // NEW: Explicit Clear
  clearSession: () => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

const STORAGE_KEY_PERSONA = 'the_sim_persona_v1';
const STORAGE_KEY_MESSAGES = 'the_sim_messages_v1';
const STORAGE_KEY_SIMULATOR = 'the_sim_simulator_v1';
const STORAGE_KEY_MODIFIERS = 'the_sim_modifiers_v1';
const STORAGE_KEY_SCENARIO = 'the_sim_scenario_v1';

export const PersonaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [persona, setPersonaState] = useState<DigitalTwinPersona | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessagesState] = useState<ChatMessage[]>([]);
  const [simulatorState, setSimulatorStateState] = useState<SimulatorState>({
     campaignName: '',
     copyA: '',
     copyB: '',
     result: null
  });
  const [simulationModifiers, setSimulationModifiers] = useState<SimulationModifiers | null>(null);
  const [scenarioMode, setScenarioModeState] = useState<ScenarioMode>('sales');

  // 1. Load from LocalStorage on Mount
  useEffect(() => {
    try {
      const savedPersona = localStorage.getItem(STORAGE_KEY_PERSONA);
      const savedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
      const savedSimulator = localStorage.getItem(STORAGE_KEY_SIMULATOR);
      const savedModifiers = localStorage.getItem(STORAGE_KEY_MODIFIERS);
      const savedScenario = localStorage.getItem(STORAGE_KEY_SCENARIO);

      if (savedPersona) {
        const parsedPersona = JSON.parse(savedPersona);
        // [FIX] Legacy ID Patching
        if (!parsedPersona.twin_id) {
            parsedPersona.twin_id = `legacy_${Date.now()}`;
        }
        setPersonaState(parsedPersona);
        
        // Initialize Modifiers: Priority = Saved > Calculated Baseline
        if (savedModifiers) {
            setSimulationModifiers(JSON.parse(savedModifiers));
        } else {
            setSimulationModifiers(calculateBaselines(parsedPersona));
        }
      }

      if (savedMessages) {
        setChatMessagesState(JSON.parse(savedMessages));
      }
      if (savedSimulator) {
        setSimulatorStateState(JSON.parse(savedSimulator));
      }
      if (savedScenario) {
        setScenarioModeState(savedScenario as ScenarioMode);
      }
    } catch (error) {
      console.error("Failed to load persistence data:", error);
    }
  }, []);

  // 2. Persistence Effects
  useEffect(() => {
    if (simulationModifiers) {
        try { localStorage.setItem(STORAGE_KEY_MODIFIERS, JSON.stringify(simulationModifiers)); } catch (e) {}
    } else {
        localStorage.removeItem(STORAGE_KEY_MODIFIERS);
    }
  }, [simulationModifiers]);

  useEffect(() => {
      try { localStorage.setItem(STORAGE_KEY_SCENARIO, scenarioMode); } catch (e) {}
  }, [scenarioMode]);

  // Explicit Clear Function (The Nuke)
  const clearSession = useCallback(() => {
      setPersonaState(null);
      setChatSession(null);
      setChatMessagesState([]);
      setSimulatorStateState({ campaignName: '', copyA: '', copyB: '', result: null });
      setSimulationModifiers(null);
      setScenarioModeState('sales');
      setIsLoading(false); // [FIX] Ensure global loading is reset to prevent context pollution
      
      localStorage.removeItem(STORAGE_KEY_PERSONA);
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
      localStorage.removeItem(STORAGE_KEY_SIMULATOR);
      localStorage.removeItem(STORAGE_KEY_MODIFIERS);
      localStorage.removeItem(STORAGE_KEY_SCENARIO);
  }, []);

  // 4. Wrappers to sync state with LocalStorage
  const setPersona = (newPersona: DigitalTwinPersona | null) => {
    if (!newPersona) {
        clearSession();
        return;
    }

    // Check if we are switching to a NEW persona (different ID)
    // We check against the current state directly
    const isNewSession = !persona || newPersona.twin_id !== persona.twin_id;

    setPersonaState(newPersona);
    
    try {
      localStorage.setItem(STORAGE_KEY_PERSONA, JSON.stringify(newPersona));
      
      // Only reset Simulator & Modifiers if it's a completely new persona session
      if (isNewSession) {
          const resetSim: SimulatorState = { campaignName: '', copyA: '', copyB: '', result: null };
          setSimulatorStateState(resetSim);
          localStorage.setItem(STORAGE_KEY_SIMULATOR, JSON.stringify(resetSim));
          
          // RESET MODIFIERS for new persona
          const newBaselines = calculateBaselines(newPersona);
          setSimulationModifiers(newBaselines);
          // Keep Chat Messages empty (already cleared via clearSession usually called before this)
          // Best practice: Caller invokes clearSession() before generation starts.
      } else {
          // If just updating (e.g. Avatar generation), keep existing Modifiers
          if (!simulationModifiers) {
              setSimulationModifiers(calculateBaselines(newPersona));
          }
      }
    } catch (e) {
      console.warn("LocalStorage full or disabled", e);
    }
  };

  const setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>> = (value) => {
    setChatMessagesState((prev) => {
      const newState = typeof value === 'function' ? value(prev) : value;
      try { localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(newState)); } catch (e) { }
      return newState;
    });
  };

  const setSimulatorState: React.Dispatch<React.SetStateAction<SimulatorState>> = (value) => {
    setSimulatorStateState((prev) => {
      const newState = typeof value === 'function' ? value(prev) : value;
      try { localStorage.setItem(STORAGE_KEY_SIMULATOR, JSON.stringify(newState)); } catch (e) {}
      return newState;
    });
  };
  
  const setScenarioMode = (mode: ScenarioMode) => {
      setScenarioModeState(mode);
  };

  const resetModifiers = () => {
    if (persona) {
        setSimulationModifiers(calculateBaselines(persona));
    }
  };

  const applyModifiers = (newModifiers: SimulationModifiers, customMessage?: string) => {
    setSimulationModifiers(newModifiers);
    if (chatMessages.length > 0) {
      const systemMsg: ChatMessage = {
        role: 'model',
        text: customMessage || '--- 系統狀態已更新 (System Updated) ---',
        timestamp: Date.now(),
        isSystemEvent: true
      };
      setChatMessages(prev => [...prev, systemMsg]);
    }
  };

  return (
    <PersonaContext.Provider value={{ 
      persona, 
      setPersona, 
      chatSession,
      setChatSession,
      isLoading, 
      setIsLoading, 
      chatMessages, 
      setChatMessages,
      simulatorState,
      setSimulatorState,
      simulationModifiers,
      setSimulationModifiers,
      resetModifiers,
      applyModifiers,
      scenarioMode,
      setScenarioMode,
      clearSession
    }}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
};

export const useChatMessages = () => {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error('useChatMessages must be used within a PersonaProvider');
  }
  return {
    messages: context.chatMessages,
    setMessages: context.setChatMessages,
    clearChat: () => context.setChatMessages([])
  };
};
