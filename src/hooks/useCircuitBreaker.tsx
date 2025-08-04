// CIRCUIT BREAKER PATTERN FOR CRITICAL OPERATIONS
import { useRef, useCallback } from "react";
import { logger } from "@/utils/logger";

interface CircuitBreakerState {
  failures: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  lastFailureTime: number;
  successCount: number;
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  timeout: number;
  monitoringPeriod: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  timeout: 60000, // 1 minute
  monitoringPeriod: 10000 // 10 seconds
};

export const useCircuitBreaker = (
  name: string,
  options: Partial<CircuitBreakerOptions> = {}
) => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const stateRef = useRef<CircuitBreakerState>({
    failures: 0,
    state: 'CLOSED',
    lastFailureTime: 0,
    successCount: 0
  });

  const canExecute = useCallback((): boolean => {
    const state = stateRef.current;
    const now = Date.now();

    switch (state.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        if (now - state.lastFailureTime >= config.timeout) {
          logger.info(`🔄 Circuit breaker ${name}: Transitioning to HALF_OPEN`);
          state.state = 'HALF_OPEN';
          state.successCount = 0;
          return true;
        }
        return false;

      case 'HALF_OPEN':
        return true;

      default:
        return false;
    }
  }, [name, config.timeout]);

  const onSuccess = useCallback(() => {
    const state = stateRef.current;
    state.failures = 0;

    if (state.state === 'HALF_OPEN') {
      state.successCount++;
      if (state.successCount >= 3) {
        logger.info(`✅ Circuit breaker ${name}: Transitioning to CLOSED`);
        state.state = 'CLOSED';
      }
    }
  }, [name]);

  const onFailure = useCallback((error: Error) => {
    const state = stateRef.current;
    state.failures++;
    state.lastFailureTime = Date.now();

    logger.warn(`❌ Circuit breaker ${name}: Failure ${state.failures}/${config.failureThreshold}`, error);

    if (state.failures >= config.failureThreshold) {
      logger.error(`🚨 Circuit breaker ${name}: Transitioning to OPEN`);
      state.state = 'OPEN';
    }
  }, [name, config.failureThreshold]);

  const execute = useCallback(async (operation: () => Promise<any>): Promise<any> => {
    if (!canExecute()) {
      logger.warn(`🚫 Circuit breaker ${name}: Operation blocked (state: ${stateRef.current.state})`);
      return null;
    }

    try {
      const result = await operation();
      onSuccess();
      return result;
    } catch (error) {
      onFailure(error as Error);
      throw error;
    }
  }, [canExecute, onSuccess, onFailure, name]);

  const getState = useCallback(() => ({
    ...stateRef.current,
    name
  }), [name]);

  return {
    execute,
    getState,
    canExecute
  };
};