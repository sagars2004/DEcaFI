import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import { randomBytes } from 'node:crypto';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { resolveNetwork, getOrCreateSeed, getDeployment } from './network';
import { createWallet, unshieldedToken, type WalletContext } from './wallet';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

globalThis.WebSocket = WebSocket as any;

async function main() {
  const { network, config: networkConfig } = resolveNetwork();
  const seed = getOrCreateSeed(network);
  const deployment = getDeployment(network);
  if (!deployment) throw new Error("No deployment");

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'mask');
  const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
  const Mask = await import(pathToFileURL(contractPath).href);
  const compiledContract = CompiledContract.make('mask', Mask.Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );

  const walletCtx = await createWallet({ network, networkConfig, seed });
  await walletCtx.wallet.waitForSyncedState();
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();

  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'mask-test-state',
      accountId,
      privateStoragePasswordProvider: () => 'Local-Devnet-Development-Placeholder-1',
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };

  const deployed: any = await findDeployedContract(providers, {
    compiledContract: compiledContract as any,
    contractAddress: deployment.address,
    privateStateId: 'maskPrivateState',
    initialPrivateState: {},
  });

  const tx = await deployed.callTx.mintCard(100n, BigInt(Math.floor(Date.now() / 1000) + 86400), new Uint8Array(randomBytes(32)));
  console.dir(tx, { depth: null });
  process.exit(0);
}

main().catch(console.error);
