'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { APP_CONFIG } from '@/lib/config';
import {
  DEMO_CASES,
  DEMO_OPERATOR_NAMES,
  INITIAL_LIVE_DROPS,
} from '@/lib/demo-data';
import { pickWeightedSkin } from '@/lib/case-engine';
import { InventoryEntry, LiveDropItem, SkinItem } from '@/types';

interface DemoStateContextValue {
  demoMode: boolean;
  username: string;
  demoBalance: number;
  casesOpened: number;
  upgradesTried: number;
  inventory: InventoryEntry[];
  liveDrops: LiveDropItem[];
  spendDemoCredits: (amount: number) => boolean;
  refillDemoCredits: (amount?: number) => void;
  resetDemoProgress: () => void;
  addDropToInventory: (
    skin: SkinItem,
    floatValue: number,
    source: 'CASE' | 'UPGRADE',
    caseTitle?: string
  ) => InventoryEntry;
  sellInventoryItem: (instanceId: string) => void;
  sellAllInventory: () => void;
  consumeForUpgrade: (instanceId: string) => void;
  recordUpgradeResult: (
    targetSkin: SkinItem | null,
    succeeded: boolean
  ) => void;
}

const STORAGE_KEY = 'dropzone_demo_state_v1';

interface PersistedDemoState {
  demoBalance: number;
  casesOpened: number;
  upgradesTried: number;
  inventory: InventoryEntry[];
}

const DemoStateContext = createContext<DemoStateContextValue | undefined>(
  undefined
);

export function DemoStateProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [demoBalance, setDemoBalance] = useState<number>(
    APP_CONFIG.initialDemoBalance
  );
  const [casesOpened, setCasesOpened] = useState<number>(0);
  const [upgradesTried, setUpgradesTried] = useState<number>(0);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [liveDrops, setLiveDrops] =
    useState<LiveDropItem[]>(INITIAL_LIVE_DROPS);

  const username = 'DemoOperator';

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedDemoState>;
        if (typeof parsed.demoBalance === 'number') {
          setDemoBalance(parsed.demoBalance);
        }
        if (typeof parsed.casesOpened === 'number') {
          setCasesOpened(parsed.casesOpened);
        }
        if (typeof parsed.upgradesTried === 'number') {
          setUpgradesTried(parsed.upgradesTried);
        }
        if (Array.isArray(parsed.inventory)) {
          setInventory(parsed.inventory);
        }
      }
    } catch {
      // ignore localStorage access errors
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload: PersistedDemoState = {
        demoBalance,
        casesOpened,
        upgradesTried,
        inventory,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore localStorage write errors
    }
  }, [hydrated, demoBalance, casesOpened, upgradesTried, inventory]);

  // Simulate ambient demo drops in the live ticker
  useEffect(() => {
    const interval = window.setInterval(() => {
      const randomCase =
        DEMO_CASES[Math.floor(Math.random() * DEMO_CASES.length)];
      const droppedSkin = pickWeightedSkin(randomCase);
      const randomUser =
        DEMO_OPERATOR_NAMES[
          Math.floor(Math.random() * DEMO_OPERATOR_NAMES.length)
        ];

      const nextDrop: LiveDropItem = {
        id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        username: randomUser,
        skin: droppedSkin,
        caseTitle: randomCase.title,
        timestamp: 'только что',
      };

      setLiveDrops((prev) => [nextDrop, ...prev.slice(0, 11)]);
    }, 5500);

    return () => window.clearInterval(interval);
  }, []);

  const spendDemoCredits = useCallback(
    (amount: number): boolean => {
      if (amount <= 0) return true;
      if (demoBalance < amount) return false;
      setDemoBalance((prev) => prev - amount);
      return true;
    },
    [demoBalance]
  );

  const refillDemoCredits = useCallback(
    (amount: number = APP_CONFIG.freeRefillAmount) => {
      setDemoBalance((prev) => prev + amount);
    },
    []
  );

  const resetDemoProgress = useCallback(() => {
    setDemoBalance(APP_CONFIG.initialDemoBalance);
    setCasesOpened(0);
    setUpgradesTried(0);
    setInventory([]);
  }, []);

  const addDropToInventory = useCallback(
    (
      skin: SkinItem,
      floatValue: number,
      source: 'CASE' | 'UPGRADE',
      caseTitle?: string
    ): InventoryEntry => {
      const entry: InventoryEntry = {
        instanceId: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        skin,
        floatValue,
        obtainedAt: new Date().toISOString(),
        source,
        caseTitle,
      };

      setInventory((prev) => [entry, ...prev]);

      if (source === 'CASE') {
        setCasesOpened((prev) => prev + 1);
      }

      const myLiveDrop: LiveDropItem = {
        id: `me-${entry.instanceId}`,
        username,
        skin,
        caseTitle: caseTitle ?? 'АПГРЕЙД',
        timestamp: 'только что',
      };
      setLiveDrops((prev) => [myLiveDrop, ...prev.slice(0, 11)]);

      return entry;
    },
    []
  );

  const sellInventoryItem = useCallback((instanceId: string) => {
    setInventory((prev) => {
      const target = prev.find((item) => item.instanceId === instanceId);
      if (!target) return prev;
      setDemoBalance((bal) => bal + target.skin.demoValue);
      return prev.filter((item) => item.instanceId !== instanceId);
    });
  }, []);

  const sellAllInventory = useCallback(() => {
    setInventory((prev) => {
      if (prev.length === 0) return prev;
      const total = prev.reduce((sum, item) => sum + item.skin.demoValue, 0);
      setDemoBalance((bal) => bal + total);
      return [];
    });
  }, []);

  const consumeForUpgrade = useCallback((instanceId: string) => {
    setInventory((prev) =>
      prev.filter((item) => item.instanceId !== instanceId)
    );
  }, []);

  const recordUpgradeResult = useCallback(
    (targetSkin: SkinItem | null, succeeded: boolean) => {
      setUpgradesTried((prev) => prev + 1);
      if (succeeded && targetSkin) {
        const floatValue = Number((0.008 + Math.random() * 0.09).toFixed(4));
        const entry: InventoryEntry = {
          instanceId: `upg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          skin: targetSkin,
          floatValue,
          obtainedAt: new Date().toISOString(),
          source: 'UPGRADE',
          caseTitle: 'АПГРЕЙД',
        };
        setInventory((prev) => [entry, ...prev]);
        setLiveDrops((prev) => [
          {
            id: `live-${entry.instanceId}`,
            username,
            skin: targetSkin,
            caseTitle: 'АПГРЕЙД',
            timestamp: 'только что',
          },
          ...prev.slice(0, 11),
        ]);
      }
    },
    []
  );

  const value = useMemo<DemoStateContextValue>(
    () => ({
      demoMode: true,
      username,
      demoBalance,
      casesOpened,
      upgradesTried,
      inventory,
      liveDrops,
      spendDemoCredits,
      refillDemoCredits,
      resetDemoProgress,
      addDropToInventory,
      sellInventoryItem,
      sellAllInventory,
      consumeForUpgrade,
      recordUpgradeResult,
    }),
    [
      demoBalance,
      casesOpened,
      upgradesTried,
      inventory,
      liveDrops,
      spendDemoCredits,
      refillDemoCredits,
      resetDemoProgress,
      addDropToInventory,
      sellInventoryItem,
      sellAllInventory,
      consumeForUpgrade,
      recordUpgradeResult,
    ]
  );

  return (
    <DemoStateContext.Provider value={value}>
      {children}
    </DemoStateContext.Provider>
  );
}

export function useDemoState(): DemoStateContextValue {
  const ctx = useContext(DemoStateContext);
  if (!ctx) {
    throw new Error('useDemoState must be used inside DemoStateProvider');
  }
  return ctx;
}
