import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  contract,
  rpc,
  scValToNative,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

import { config } from '../config';

/**
 * Reads a wallet's balance of the campaign token straight from its contract.
 * Works for native XLM and any other Stellar asset contract. Returns null when
 * the account does not exist on this network yet.
 */
export async function tokenBalance(address: string): Promise<bigint | null> {
  const server = new rpc.Server(config.rpcUrl, { allowHttp: config.rpcUrl.startsWith('http:') });
  const tx = new TransactionBuilder(new Account(contract.NULL_ACCOUNT, '0'), {
    fee: BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(new Contract(config.tokenId).call('balance', new Address(address).toScVal()))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim) || !sim.result) return null;
  return BigInt(scValToNative(sim.result.retval) as bigint);
}
