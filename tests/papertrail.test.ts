import { describe, it, expect, beforeAll } from 'vitest';
import { initSimnet, type Simnet } from '@stacks/clarinet-sdk';
import { Cl } from '@stacks/transactions';

const CONTRACT = 'papertrail';
const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);

let simnet: Simnet;
let owner: string;
let other: string;

beforeAll(async () => {
  simnet = await initSimnet();
  const accounts = simnet.getAccounts();
  // Use a non-deployer wallet so the registration fee transfer (to the
  // contract owner == deployer) is between two distinct principals.
  owner = accounts.get('wallet_1')!;
  other = accounts.get('wallet_2')!;
});

function register(hash: string, sender: string, title = 'My Document', category = 1) {
  return simnet.callPublicFn(
    CONTRACT,
    'register-document',
    [Cl.bufferFromHex(hash), Cl.stringAscii(title), Cl.uint(category)],
    sender
  );
}

describe('papertrail contract', () => {
  it('registers a document and charges the fee', () => {
    const { result, events } = register(HASH_A, owner);
    expect(result).toStrictEqual(Cl.ok(Cl.bool(true)));
    const transfer = events.find(e => e.event === 'stx_transfer_event');
    expect(transfer).toBeDefined();
    expect((transfer as any).data.amount).toBe('50000');
  });

  it('rejects duplicate registration (err u101)', () => {
    const { result } = register(HASH_A, owner);
    expect(result).toStrictEqual(Cl.error(Cl.uint(101)));
  });

  it('rejects an invalid category (err u104)', () => {
    const { result } = simnet.callPublicFn(
      CONTRACT,
      'register-document',
      [Cl.bufferFromHex(HASH_B), Cl.stringAscii('Bad'), Cl.uint(9)],
      owner
    );
    expect(result).toStrictEqual(Cl.error(Cl.uint(104)));
  });

  it('exposes the document via get-document', () => {
    const { result } = simnet.callReadOnlyFn(
      CONTRACT,
      'get-document',
      [Cl.bufferFromHex(HASH_A)],
      owner
    );
    expect(result.type).toBe('some');
  });

  it('reports is-registered correctly', () => {
    const yes = simnet.callReadOnlyFn(CONTRACT, 'is-registered', [Cl.bufferFromHex(HASH_A)], owner);
    const no = simnet.callReadOnlyFn(CONTRACT, 'is-registered', [Cl.bufferFromHex(HASH_B)], owner);
    expect(yes.result).toStrictEqual(Cl.bool(true));
    expect(no.result).toStrictEqual(Cl.bool(false));
  });

  it('blocks non-owners from revoking (err u107)', () => {
    const { result } = simnet.callPublicFn(
      CONTRACT,
      'revoke-document',
      [Cl.bufferFromHex(HASH_A)],
      other
    );
    expect(result).toStrictEqual(Cl.error(Cl.uint(107)));
  });

  it('lets the owner revoke, then blocks a second revoke (err u103)', () => {
    const first = simnet.callPublicFn(CONTRACT, 'revoke-document', [Cl.bufferFromHex(HASH_A)], owner);
    expect(first.result).toStrictEqual(Cl.ok(Cl.bool(true)));

    const revoked = simnet.callReadOnlyFn(CONTRACT, 'is-revoked', [Cl.bufferFromHex(HASH_A)], owner);
    expect(revoked.result).toStrictEqual(Cl.bool(true));

    const second = simnet.callPublicFn(CONTRACT, 'revoke-document', [Cl.bufferFromHex(HASH_A)], owner);
    expect(second.result).toStrictEqual(Cl.error(Cl.uint(103)));
  });

  it('tracks platform stats', () => {
    const { result } = simnet.callReadOnlyFn(CONTRACT, 'get-stats', [], owner);
    const stats = Cl.prettyPrint(result);
    expect(stats).toContain('total-registrations');
  });
});
