import { Networks } from '@stellar/stellar-sdk';

const network = (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'testnet') as
  'testnet' | 'mainnet' | 'futurenet';

const passphrases = {
  testnet: Networks.TESTNET,
  mainnet: Networks.PUBLIC,
  futurenet: Networks.FUTURENET,
};

// NEXT_PUBLIC_* values are inlined at build time, so each one must be read
// with its full literal name.
export const config = {
  apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, ''),
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aidline-frontend.vercel.app').replace(
    /\/$/,
    '',
  ),
  network,
  networkPassphrase: passphrases[network],
  rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  contractId: process.env.NEXT_PUBLIC_AIDLINE_CONTRACT_ID ?? '',
  tokenId: process.env.NEXT_PUBLIC_AIDLINE_TOKEN_ID ?? '',
  tokenSymbol: process.env.NEXT_PUBLIC_TOKEN_SYMBOL ?? 'XLM',
  tokenDecimals: Number(process.env.NEXT_PUBLIC_TOKEN_DECIMALS ?? 7),
  adminAddress: process.env.NEXT_PUBLIC_ADMIN_ADDRESS ?? '',
};

export const explorer = {
  tx: (hash: string) => `https://stellar.expert/explorer/${network}/tx/${hash}`,
  account: (address: string) => `https://stellar.expert/explorer/${network}/account/${address}`,
  contract: (id: string) => `https://stellar.expert/explorer/${network}/contract/${id}`,
};
