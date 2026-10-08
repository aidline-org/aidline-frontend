import {
  Address,
  BASE_FEE,
  Contract,
  nativeToScVal,
  rpc,
  scValToNative,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';

import { config } from '../config';

/** Signs a base64 transaction envelope and returns the signed envelope. */
export type Signer = (txXdr: string) => Promise<string>;

export interface TxResult<T = unknown> {
  hash: string;
  value: T;
}

const server = () =>
  new rpc.Server(config.rpcUrl, { allowHttp: config.rpcUrl.startsWith('http:') });

/**
 * Builds a contract call, simulates it to get the footprint and fee, asks the
 * wallet to sign, submits it and waits until the ledger includes it.
 */
export async function invoke<T = unknown>(
  source: string,
  method: string,
  args: xdr.ScVal[],
  sign: Signer,
  onStatus?: (status: 'signing' | 'submitting' | 'confirming') => void,
): Promise<TxResult<T>> {
  const rpcServer = server();
  const account = await rpcServer.getAccount(source);
  const built = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(new Contract(config.contractId).call(method, ...args))
    .setTimeout(120)
    .build();

  const prepared = await rpcServer.prepareTransaction(built);
  onStatus?.('signing');
  const signed = await sign(prepared.toXDR());

  onStatus?.('submitting');
  const sent = await rpcServer.sendTransaction(
    TransactionBuilder.fromXDR(signed, config.networkPassphrase),
  );
  if (sent.status === 'ERROR') {
    throw new Error(`The network rejected transaction ${sent.hash}. Please try again.`);
  }

  onStatus?.('confirming');
  const final = await waitForResult(rpcServer, sent.hash);
  if (final.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transaction ${sent.hash} failed with status ${final.status}`);
  }
  const value = final.returnValue ? (scValToNative(final.returnValue) as T) : (undefined as T);
  return { hash: sent.hash, value };
}

/**
 * Polls until the transaction leaves NOT_FOUND. Network errors are retried:
 * once submitted, a transaction must not be reported as failed because of a
 * dropped request.
 */
async function waitForResult(rpcServer: rpc.Server, hash: string, attempts = 40) {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await rpcServer.getTransaction(hash);
      if (res.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) return res;
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(
    `Transaction ${hash} was submitted but not confirmed yet. Check the explorer before retrying.${
      lastError ? ` (${String(lastError)})` : ''
    }`,
  );
}

const addr = (a: string) => new Address(a).toScVal();
const u64 = (n: bigint | string | number) => nativeToScVal(BigInt(n), { type: 'u64' });
const i128 = (n: bigint | string) => nativeToScVal(BigInt(n), { type: 'i128' });
const str = (s: string) => nativeToScVal(s, { type: 'string' });

export type Status = Parameters<NonNullable<Parameters<typeof invoke>[4]>>[0];

/** Typed wrappers for each contract entry point the app uses. */
export const aidline = {
  donate: (
    donor: string,
    campaignId: string,
    amount: bigint,
    sign: Signer,
    on?: (s: Status) => void,
  ) => invoke(donor, 'donate', [addr(donor), u64(campaignId), i128(amount)], sign, on),

  refund: (donor: string, campaignId: string, sign: Signer, on?: (s: Status) => void) =>
    invoke<bigint>(donor, 'refund', [addr(donor), u64(campaignId)], sign, on),

  approveMilestone: (
    verifier: string,
    campaignId: string,
    proofUri: string,
    sign: Signer,
    on?: (s: Status) => void,
  ) => invoke<bigint>(verifier, 'approve_milestone', [u64(campaignId), str(proofUri)], sign, on),

  cancelCampaign: (caller: string, campaignId: string, sign: Signer, on?: (s: Status) => void) =>
    invoke(caller, 'cancel_campaign', [addr(caller), u64(campaignId)], sign, on),

  createCampaign: (
    p: {
      creator: string;
      beneficiary: string;
      verifier: string;
      kind: 'emergency' | 'climate';
      metadataUri: string;
      deadline: Date;
      milestones: bigint[];
    },
    sign: Signer,
    on?: (s: Status) => void,
  ) =>
    invoke<bigint>(
      p.creator,
      'create_campaign',
      [
        addr(p.creator),
        addr(p.beneficiary),
        addr(p.verifier),
        // Unit enum variants are encoded as a vector holding the variant name.
        xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(p.kind === 'emergency' ? 'Emergency' : 'Climate')]),
        str(p.metadataUri),
        u64(Math.floor(p.deadline.getTime() / 1000)),
        nativeToScVal(p.milestones.map((m) => nativeToScVal(m, { type: 'i128' }))),
      ],
      sign,
      on,
    ),

  addVerifier: (admin: string, verifier: string, sign: Signer, on?: (s: Status) => void) =>
    invoke(admin, 'add_verifier', [addr(verifier)], sign, on),
};
