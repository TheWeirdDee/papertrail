/// <reference path="../node_modules/@stacks/clarinet-sdk/vitest-helpers/src/vitest.d.ts" />
import { describe, expect, it, beforeEach } from 'vitest';
import { initSimnet } from '@stacks/clarinet-sdk';
import { Cl } from '@stacks/transactions';

describe('gm-social-v14 contract', () => {
  let simnet: any;
  const accounts = new Map();
  let WALLET_1: string;

  beforeEach(async () => {
    simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    WALLET_1 = accounts.get('wallet_1') || accounts.get('deployer')!;
    
    // Set gm-social-v14-v12 as the governor for gm-token-v14
    const deployer = accounts.get('deployer')!;
    simnet.callPublicFn('gm-token-v14', 'set-governor', [Cl.principal(`${deployer}.gm-social-v14`)], deployer);
    // Ensure gm-social contract is set as the token bridge contract
    simnet.callPublicFn('gm-social-v14', 'set-token-contract', [Cl.principal(`${deployer}.gm-token-v14`)], deployer);
  });

  it('allows a user to say GM', () => {
    const { result } = simnet.callPublicFn(
      'gm-social-v14',
      'say-gm',
      [],
      WALLET_1
    );

    expect(result).toBeOk(Cl.tuple({
      points: Cl.uint(5),
      streak: Cl.uint(1),
    }));
  });

  it('prevents saying GM twice in the same day (Clarity 4 stacks-block-time logic)', () => {
    // First GM
    simnet.callPublicFn('gm-social-v14', 'say-gm', [], WALLET_1);

    // Second GM in the same block/time (fails)
    const { result } = simnet.callPublicFn(
      'gm-social-v14',
      'say-gm',
      [],
      WALLET_1
    );

    // ERR-COOLDOWN-ACTIVE (u101)
    expect(result).toBeErr(Cl.uint(101));
  });

  it('allows saying GM after 24 hours (86400 seconds)', () => {
    // First GM
    simnet.callPublicFn('gm-social-v14', 'say-gm', [], WALLET_1);

    // Advance time by 145 blocks (144 is the cooldown)
    simnet.mineEmptyBurnBlocks(145);

    // Second GM (success)
    const { result } = simnet.callPublicFn(
      'gm-social-v14',
      'say-gm',
      [],
      WALLET_1
    );

    expect(result).toBeOk(Cl.tuple({
      points: Cl.uint(10),
      streak: Cl.uint(2),
    }));
  });
});
