import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, REALTIME_LISTEN_TYPES } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

interface RealtimeManagerOptions {
  enabled?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface ConnectionStatus {
  isConnected: boolean;
  state: string;
  error: string | null;
  retryCount: number;
}

export const useRealtimeManager = (options: RealtimeManagerOptions = {}) => {
  const {
    enabled = true,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    state: 'closed',
    error: null,
    retryCount: 0
  });

  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateConnectionStatus = useCallback((channelId: string, channel: RealtimeChannel) => {
    setConnectionStatus(prev => ({
      ...prev,
      isConnected: channel.state === 'joined',
      state: channel.state,
      error: null
    }));
  }, []);

  const handleConnectionError = useCallback((channelId: string, error: any) => {
    try {
      logger.warn(`Realtime connection error for ${channelId}:`, error);
      
      setConnectionStatus(prev => ({
        ...prev,
        error: error.message || 'Connection failed',
        retryCount: prev.retryCount + 1
      }));
    } catch (e) {
      // Prevent error handling from crashing
      console.error('Error in handleConnectionError:', e);
    }
  }, []);

  const createChannel = useCallback((
    channelId: string,
    subscriptions: Array<{
      event: string;
      schema?: string;
      table?: string;
      filter?: string;
      callback: (payload: any) => void;
    }>
  ) => {
    if (!enabled) {
      console.log('Realtime disabled, skipping channel creation');
      return null;
    }

    // Clean up existing channel if it exists
    const existingChannel = channelsRef.current.get(channelId);
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
      channelsRef.current.delete(channelId);
    }

    // Create new channel
    let channel = supabase.channel(channelId);

    // Add all subscriptions to the channel
    subscriptions.forEach(sub => {
      if (sub.table) {
        channel = channel.on(
          REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
          {
            event: sub.event as any,
            schema: sub.schema || 'public',
            table: sub.table,
            ...(sub.filter && { filter: sub.filter })
          },
          sub.callback
        );
      } else {
        channel = channel.on(sub.event as any, {}, sub.callback);
      }
    });

    // Subscribe with simplified callback
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        updateConnectionStatus(channelId, channel);
      } else if (status === 'CHANNEL_ERROR') {
        handleConnectionError(channelId, new Error('Channel subscription failed'));
      }
    });

    channelsRef.current.set(channelId, channel);
    return channel;
  }, [enabled, handleConnectionError, updateConnectionStatus]);

  const removeChannel = useCallback((channelId: string) => {
    const channel = channelsRef.current.get(channelId);
    if (channel) {
      supabase.removeChannel(channel);
      channelsRef.current.delete(channelId);
    }
  }, []);

  const removeAllChannels = useCallback(() => {
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current.clear();
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount with error protection
  useEffect(() => {
    return () => {
      try {
        removeAllChannels();
      } catch (error) {
        logger.error('Error during realtime cleanup:', error);
      }
    };
  }, [removeAllChannels]);

  return {
    createChannel,
    removeChannel,
    removeAllChannels,
    connectionStatus,
    isEnabled: enabled
  };
};