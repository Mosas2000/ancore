import { useState, useEffect, useCallback } from 'react';
import { fetchAccountBalance, fetchAccountData } from '../lib/horizon';

export type AccountStatus = 'active' | 'inactive' | 'locked';

export interface AccountOverview {
  balance: number;
  nonce: number;
  status: AccountStatus;
}

export class AccountOverviewError extends Error {
  code: 'ACCOUNT_NOT_FOUND' | 'HORIZON_UNAVAILABLE' | 'FETCH_FAILED';

  constructor(
    message: string,
    code: 'ACCOUNT_NOT_FOUND' | 'HORIZON_UNAVAILABLE' | 'FETCH_FAILED',
  ) {
    super(message);
    this.name = 'AccountOverviewError';
    this.code = code;
  }
}

export class AccountNotFoundError extends AccountOverviewError {
  constructor() {
    super('Account not found on network', 'ACCOUNT_NOT_FOUND');
    this.name = 'AccountNotFoundError';
  }
}

export class HorizonUnavailableError extends AccountOverviewError {
  constructor() {
    super('Horizon is temporarily unavailable', 'HORIZON_UNAVAILABLE');
    this.name = 'HorizonUnavailableError';
  }
}

export interface UseAccountOverviewReturn {
  data: AccountOverview | null;
  isLoading: boolean;
  error: AccountOverviewError | null;
  refetch: () => Promise<void>;
}

const MOCK_ACCOUNT_OVERVIEW: AccountOverview = {
  balance: 1250.75,
  nonce: 42,
  status: 'active',
};

function classifyAccountOverviewError(status?: number): AccountOverviewError {
  if (status === 404) {
    return new AccountNotFoundError();
  }

  if (status && status >= 500) {
    return new HorizonUnavailableError();
  }

  return new AccountOverviewError('Failed to fetch account data', 'FETCH_FAILED');
}

/**
 * Hook to fetch account overview metrics (balance, nonce, status).
 * Uses Horizon API to fetch real Stellar account data.
 */
export function useAccountOverview(publicKey: string): UseAccountOverviewReturn {
  const [data, setData] = useState<AccountOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<AccountOverviewError | null>(null);

  const fetchData = useCallback(async () => {
    if (!publicKey) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accountData = await fetchAccountData(publicKey);
      const balance = await fetchAccountBalance(publicKey);

      setData({
        balance,
        nonce: Number(accountData.sequence),
        status: 'active',
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch account data'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
