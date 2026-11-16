'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { APP_CONFIG } from '@/lib/config';
import { INITIAL_LIVE_DROPS } from '@/lib/demo-data';
import { InventoryEntry, LiveDropItem, SkinItem } from '@/types';

export interface ServerCaseOpenPayload {
  demoBalance: number;
  casesOpened: number;
  entry: InventoryEntry;
  rollHash: string;
  reel: SkinItem[];
  winnerIndex: number;
  liveDrop: LiveDropItem;
}

export interface ServerUpgradePayload {
  succeeded: boolean;
  chancePercent: number;
  roll: number;
  consumedInstanceId: string;
  targetSkin: SkinItem;
  wonEntry: InventoryEntry | null;
  demoBalance: number;
  upgradesTried: number;
}

interface DemoStateContextValue {
  demoMode: boolean;
  isLoaded: boolean;
  username: string;
  demoBalance: number;
  casesOpened: number;
  upgradesTried: number;
  inventory: InventoryEntry[];
  liveDrops: LiveDropItem[];
  refreshSession: () => Promise<void>;
  refillDemoCredits: (amount?: number) => Promise<boolean>;
  resetDemoProgress: () => Promise<void>;
  openCaseOnServer: (caseSlug: string) => Promise<ServerCaseOpenPayload>;
  finalizeCaseDropInUi: (payload: ServerCaseOpenPayload) => void;
  sellInventoryItem: (instanceId: string) => Promise<boolean>;
  sellAllInventory: () => Promise<boolean>;
  runUpgradeOnServer: (
    instanceId: string,
    targetSkinSlug: string
  ) => Promise<ServerUpgradePayload>;
  finalizeUpgradeInUi: (payload: ServerUpgradePayload) => void;
}

const LEGACY_STORAGE_KEY = 'dropzone_demo_state_v1';

function createIdempotencyKey(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const DemoStateContext = createContext<DemoStateContextValue | undefined>(
  undefined
);

export function DemoStateProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [username, setUsername] = useState<string>('Operator');
  const [demoBalance, setDemoBalance] = useState<number>(
    APP_CONFIG.initialDemoBalance
  );
  const [casesOpened, setCasesOpened] = useState<number>(0);
  const [upgradesTried, setUpgradesTried] = useState<number>(0);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [liveDrops, setLiveDrops] =
    useState<LiveDropItem[]>(INITIAL_LIVE_DROPS);

  const sellingIdsRef = useRef<Set<string>>(new Set());
  const sellAllLockRef = useRef(false);
  const refillLockRef = useRef(false);
  const resetLockRef = useRef(false);
  const finalizedDropIdsRef = useRef<Set<string>>(new Set());
  const finalizedUpgradeIdsRef = useRef<Set<string>>(new Set());

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return;

      const data = (await res.json()) as {
        user: {
          username: string;
          demoBalance: number;
          casesOpened: number;
          upgradesTried: number;
        };
        inventory: InventoryEntry[];
        liveDrops: LiveDropItem[];
      };

      setUsername(data.user.username);
      setDemoBalance(data.user.demoBalance);
      setCasesOpened(data.user.casesOpened);
      setUpgradesTried(data.user.upgradesTried);
      setInventory(data.inventory);
      if (Array.isArray(data.liveDrops) && data.liveDrops.length > 0) {
        setLiveDrops(data.liveDrops);
      }
    } catch (err) {
      console.error('[DemoState] Failed to load server session:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    void refreshSession();
  }, [refreshSession]);

  // Poll real server live drops from PostgreSQL DropLog
  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch('/api/drops/live', {
          method: 'GET',
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = (await res.json()) as { drops?: LiveDropItem[] };
        if (Array.isArray(data.drops) && data.drops.length > 0) {
          setLiveDrops(data.drops);
        }
      } catch {
        // ignore transient network errors
      }
    }, 7000);

    return () => window.clearInterval(interval);
  }, []);

  const refillDemoCredits = useCallback(
    async (amount: number = APP_CONFIG.freeRefillAmount): Promise<boolean> => {
      if (refillLockRef.current) return false;
      refillLockRef.current = true;
      try {
        const res = await fetch('/api/demo/refill', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': createIdempotencyKey('refill'),
          },
          body: JSON.stringify({ amount }),
        });

        if (!res.ok) return false;
        const data = (await res.json()) as { demoBalance: number };
        setDemoBalance(data.demoBalance);
        return true;
      } catch (err) {
        console.error('[DemoState] Demo refill failed:', err);
        return false;
      } finally {
        refillLockRef.current = false;
      }
    },
    []
  );

  const resetDemoProgress = useCallback(async () => {
    if (resetLockRef.current) return;
    resetLockRef.current = true;
    try {
      const res = await fetch('/api/demo/reset', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Idempotency-Key': createIdempotencyKey('reset'),
        },
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        demoBalance: number;
        casesOpened: number;
        upgradesTried: number;
      };
      setDemoBalance(data.demoBalance);
      setCasesOpened(data.casesOpened);
      setUpgradesTried(data.upgradesTried);
      setInventory([]);
    } catch (err) {
      console.error('[DemoState] Demo reset failed:', err);
    } finally {
      resetLockRef.current = false;
    }
  }, []);

  const openCaseOnServer = useCallback(
    async (caseSlug: string): Promise<ServerCaseOpenPayload> => {
      const res = await fetch(
        `/api/cases/${encodeURIComponent(caseSlug)}/open`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Idempotency-Key': createIdempotencyKey(`open-${caseSlug}`),
          },
        }
      );

      const data = (await res.json()) as ServerCaseOpenPayload & {
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        if (typeof data.demoBalance === 'number') {
          setDemoBalance(data.demoBalance);
        }
        throw new Error(data.message || 'Не удалось открыть кейс');
      }

      // Immediately sync authoritative deducted balance from server transaction
      setDemoBalance(data.demoBalance);
      return data;
    },
    []
  );

  const finalizeCaseDropInUi = useCallback((payload: ServerCaseOpenPayload) => {
    const id = payload.entry.instanceId;
    if (finalizedDropIdsRef.current.has(id)) return;
    finalizedDropIdsRef.current.add(id);

    setCasesOpened(payload.casesOpened);
    setInventory((prev) => {
      if (prev.some((item) => item.instanceId === id)) return prev;
      return [payload.entry, ...prev];
    });
    setLiveDrops((prev) => {
      if (prev.some((d) => d.id === payload.liveDrop.id)) return prev;
      return [payload.liveDrop, ...prev.slice(0, 11)];
    });
  }, []);

  const sellInventoryItem = useCallback(
    async (instanceId: string): Promise<boolean> => {
      if (sellingIdsRef.current.has(instanceId) || sellAllLockRef.current) {
        return false;
      }
      sellingIdsRef.current.add(instanceId);

      try {
        const res = await fetch('/api/inventory/sell', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': createIdempotencyKey(`sell-${instanceId}`),
          },
          body: JSON.stringify({ instanceId }),
        });

        if (!res.ok) return false;
        const data = (await res.json()) as {
          demoBalance: number;
          soldIds: string[];
        };

        // Pure state updates outside each other — zero double credit under React StrictMode
        setInventory((prev) =>
          prev.filter((item) => !data.soldIds.includes(item.instanceId))
        );
        setDemoBalance(data.demoBalance);
        return true;
      } catch (err) {
        console.error('[DemoState] Sell item failed:', err);
        return false;
      } finally {
        sellingIdsRef.current.delete(instanceId);
      }
    },
    []
  );

  const sellAllInventory = useCallback(async (): Promise<boolean> => {
    if (sellAllLockRef.current) return false;
    sellAllLockRef.current = true;

    try {
      const res = await fetch('/api/inventory/sell', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': createIdempotencyKey('sell-all'),
        },
        body: JSON.stringify({ sellAll: true }),
      });

      if (!res.ok) return false;
      const data = (await res.json()) as {
        demoBalance: number;
        soldIds: string[];
      };

      const soldSet = new Set(data.soldIds);
      setInventory((prev) =>
        prev.filter((item) => !soldSet.has(item.instanceId))
      );
      setDemoBalance(data.demoBalance);
      return true;
    } catch (err) {
      console.error('[DemoState] Sell all failed:', err);
      return false;
    } finally {
      sellAllLockRef.current = false;
    }
  }, []);

  const runUpgradeOnServer = useCallback(
    async (
      instanceId: string,
      targetSkinSlug: string
    ): Promise<ServerUpgradePayload> => {
      const res = await fetch('/api/upgrade', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': createIdempotencyKey(`upgrade-${instanceId}`),
        },
        body: JSON.stringify({ instanceId, targetSkinSlug }),
      });

      const data = (await res.json()) as ServerUpgradePayload & {
        message?: string;
      };

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка проведения апгрейда');
      }

      return data;
    },
    []
  );

  const finalizeUpgradeInUi = useCallback((payload: ServerUpgradePayload) => {
    const key = payload.consumedInstanceId;
    if (finalizedUpgradeIdsRef.current.has(key)) return;
    finalizedUpgradeIdsRef.current.add(key);

    setUpgradesTried(payload.upgradesTried);
    setDemoBalance(payload.demoBalance);
    setInventory((prev) => {
      const withoutSource = prev.filter(
        (item) => item.instanceId !== payload.consumedInstanceId
      );
      if (payload.succeeded && payload.wonEntry) {
        if (
          withoutSource.some(
            (i) => i.instanceId === payload.wonEntry?.instanceId
          )
        ) {
          return withoutSource;
        }
        return [payload.wonEntry, ...withoutSource];
      }
      return withoutSource;
    });
  }, []);

  const value = useMemo<DemoStateContextValue>(
    () => ({
      demoMode: true,
      isLoaded,
      username,
      demoBalance,
      casesOpened,
      upgradesTried,
      inventory,
      liveDrops,
      refreshSession,
      refillDemoCredits,
      resetDemoProgress,
      openCaseOnServer,
      finalizeCaseDropInUi,
      sellInventoryItem,
      sellAllInventory,
      runUpgradeOnServer,
      finalizeUpgradeInUi,
    }),
    [
      isLoaded,
      username,
      demoBalance,
      casesOpened,
      upgradesTried,
      inventory,
      liveDrops,
      refreshSession,
      refillDemoCredits,
      resetDemoProgress,
      openCaseOnServer,
      finalizeCaseDropInUi,
      sellInventoryItem,
      sellAllInventory,
      runUpgradeOnServer,
      finalizeUpgradeInUi,
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
