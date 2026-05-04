import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { deriveKeypairFromMnemonic } from '@ancore/crypto';

import {
  deriveOnboardingKeypair,
  resetOnboardingStorageManager,
  useOnboarding,
} from '../useOnboarding';

vi.mock('@ancore/stellar', () => ({
  StellarClient: vi.fn().mockImplementation(() => ({
    fundWithFriendbot: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('useOnboarding', () => {
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  beforeEach(() => {
    localStorage.clear();
    resetOnboardingStorageManager();
  });

  afterEach(() => {
    resetOnboardingStorageManager();
    localStorage.clear();
  });

  it('derives the same keypair as the crypto primitive', () => {
    const expected = deriveKeypairFromMnemonic(mnemonic, 0);
    const actual = deriveOnboardingKeypair(mnemonic);

    expect(actual.publicKey()).toBe(expected.publicKey());
    expect(actual.secret()).toBe(expected.secret());
  });

  it('stores a real encrypted account when onboarding completes', async () => {
    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.setPassword('SecurePass123!');
      result.current.generateMnemonic();
    });

    const generatedMnemonic = result.current.mnemonic;
    expect(generatedMnemonic).toBeTruthy();

    await act(async () => {
      await result.current.deployAccount('testnet');
    });

    const expectedKeypair = deriveKeypairFromMnemonic(generatedMnemonic!, 0);

    expect(result.current.step).toBe('success');
    expect(result.current.account?.publicKey).toBe(expectedKeypair.publicKey());
    expect(result.current.account?.encryptedMnemonic.ciphertext).toBeTruthy();
    expect(result.current.account?.encryptedMnemonic.ciphertext).not.toBe(
      expectedKeypair.publicKey()
    );

    const storedAccount = JSON.parse(localStorage.getItem('account') ?? 'null') as {
      salt: string;
      iv: string;
      data: string;
    } | null;

    expect(storedAccount).not.toBeNull();
    expect(storedAccount?.salt).toBeTruthy();
    expect(storedAccount?.iv).toBeTruthy();
    expect(storedAccount?.data).toBeTruthy();
    expect(storedAccount?.salt).not.toBe('test-salt');
    expect(storedAccount?.iv).not.toBe('test-iv');
  });
});
