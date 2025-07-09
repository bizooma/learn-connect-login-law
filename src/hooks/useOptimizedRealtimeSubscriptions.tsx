import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { optimizationTracker } from '@/utils/algorithmicOptimizationTracker';

interface SubscriptionConfig {
  id: string;
  table: string;
  filter?: string;
  events?: ('INSERT' | 'UPDATE' | 'DELETE')[];
  callback: (payload: any) => void;
}

interface SubscriptionManager {
  subscriptions: Map<string, any>;
  callbacks: Map<string, Set<(payload: any) => void>>;
  lastUpdate: Map<string, number>;
}

class RealtimeManager {
  private static instance: RealtimeManager;
  private manager: SubscriptionManager;
  private throttleDelay = 1000; // 1 second throttle
  
  private constructor() {
    this.manager = {
      subscriptions: new Map(),
      callbacks: new Map(),
      lastUpdate: new Map()
    };
  }

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  // Throttled callback execution to prevent excessive updates
  private throttledCallback = (subscriptionId: string, payload: any) => {
    const now = Date.now();
    const lastUpdate = this.manager.lastUpdate.get(subscriptionId) || 0;
    
    if (now - lastUpdate < this.throttleDelay) {
      return; // Skip if too recent
    }
    
    this.manager.lastUpdate.set(subscriptionId, now);
    
    const callbacks = this.manager.callbacks.get(subscriptionId);
    if (callbacks) {
      callbacks.forEach(callback => callback(payload));
    }
  };

  subscribe(config: SubscriptionConfig): () => void {
    const { id, table, filter, events = ['*'], callback } = config;
    
    // Add callback to existing subscription if it exists
    if (this.manager.subscriptions.has(id)) {
      const callbacks = this.manager.callbacks.get(id) || new Set();
      callbacks.add(callback);
      this.manager.callbacks.set(id, callbacks);
      
      // Return unsubscribe function
      return () => {
        const callbacks = this.manager.callbacks.get(id);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            this.unsubscribe(id);
          }
        }
      };
    }
    
    // Create new subscription
    const channelName = `optimized-${id}`;
    const channel = supabase.channel(channelName);
    
    // Add event listeners for each event type
    events.forEach(event => {
      const eventConfig: any = {
        event: event === '*' ? '*' : event,
        schema: 'public',
        table
      };
      
      if (filter) {
        eventConfig.filter = filter;
      }
      
      channel.on('postgres_changes', eventConfig, (payload) => {
        this.throttledCallback(id, payload);
      });
    });
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        optimizationTracker.trackOptimization(
          `RealtimeSubscription_${id}`,
          'parallel_processing',
          0,
          1,
          1
        );
      }
    });
    
    // Store subscription and callback
    this.manager.subscriptions.set(id, channel);
    this.manager.callbacks.set(id, new Set([callback]));
    
    console.log(`📡 Optimized subscription created: ${id}`);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.manager.callbacks.get(id);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.unsubscribe(id);
        }
      }
    };
  }

  private unsubscribe(id: string): void {
    const channel = this.manager.subscriptions.get(id);
    if (channel) {
      supabase.removeChannel(channel);
      this.manager.subscriptions.delete(id);
      this.manager.callbacks.delete(id);
      this.manager.lastUpdate.delete(id);
      console.log(`📡 Optimized subscription removed: ${id}`);
    }
  }

  // Get subscription stats for monitoring
  getStats() {
    return {
      activeSubscriptions: this.manager.subscriptions.size,
      totalCallbacks: Array.from(this.manager.callbacks.values())
        .reduce((sum, callbacks) => sum + callbacks.size, 0)
    };
  }

  // Cleanup all subscriptions (useful for app cleanup)
  cleanup(): void {
    this.manager.subscriptions.forEach((channel, id) => {
      supabase.removeChannel(channel);
    });
    this.manager.subscriptions.clear();
    this.manager.callbacks.clear();
    this.manager.lastUpdate.clear();
  }
}

export const useOptimizedRealtimeSubscriptions = () => {
  const managerRef = useRef(RealtimeManager.getInstance());
  const activeSubscriptionsRef = useRef<Set<() => void>>(new Set());

  const subscribe = useCallback((config: SubscriptionConfig) => {
    const unsubscribe = managerRef.current.subscribe(config);
    activeSubscriptionsRef.current.add(unsubscribe);
    return unsubscribe;
  }, []);

  const getStats = useCallback(() => {
    return managerRef.current.getStats();
  }, []);

  // Cleanup all subscriptions created by this hook instance
  useEffect(() => {
    return () => {
      activeSubscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      activeSubscriptionsRef.current.clear();
    };
  }, []);

  return {
    subscribe,
    getStats
  };
};

export default useOptimizedRealtimeSubscriptions;