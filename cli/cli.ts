/**
 * CLI for interacting with DEcaFI mask contract
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import { randomBytes } from 'node:crypto';

// Midnight SDK imports
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { resolveNetwork, getOrCreateSeed, getDeployment } from './network';
import { createWallet, persistWalletState, unshieldedToken, type WalletContext } from './wallet';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

// Enable WebSocket for GraphQL subscriptions
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const PRIVATE_STATE_ID = 'maskPrivateState';

const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'mask');

// Load compiled contract
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');

if (!fs.existsSync(contractPath)) {
  console.error('\n❌ Contract not compiled! Run: npm run compile\n');
  process.exit(1);
}

const Mask = await import(pathToFileURL(contractPath).href);

const compiledContract = CompiledContract.make('mask', Mask.Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

// ─── Providers ─────────────────────────────────────────────────────────────────

async function createProviders(walletCtx: WalletContext) {
  const privateStatePassword = process.env.PRIVATE_STATE_PASSWORD?.trim() || 'Local-Devnet-Development-Placeholder-1';

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
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'mask-state',
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

// ─── Main CLI ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   DEcaFI CLI                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const rl = createInterface({ input: stdin, output: stdout });

  // Check for deployment
  const deployment = getDeployment(network);
  if (!deployment) {
    console.error(`No deploy on file for network ${network}. Run \`npx tsx cli/deploy.ts\` first.`);
    process.exit(1);
  }
  console.log(`  Contract: ${deployment.address}`);
  console.log(`  Network: ${network}\n`);

  try {
    const seed = SEED;
    console.log('  Connecting to wallet...');
    const walletCtx = await createWallet({ network, networkConfig, seed });

    console.log('  Syncing with network...');
    const state = await walletCtx.wallet.waitForSyncedState();
    console.log('  ✓ Synced with network.');
    await persistWalletState(network, walletCtx);

    const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
    console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);

    console.log('  Connecting to contract...');
    const providers = await createProviders(walletCtx);

    const deployed: any = await findDeployedContract(providers, {
      compiledContract: compiledContract as any,
      contractAddress: deployment.address,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
    });

    console.log('  ✅ Connected!\n');

    let running = true;
    
    // In-memory private state for the demo
    let currentCard: { commitment: Uint8Array, limit: bigint, expiry: bigint, seed: Uint8Array } | null = null;
    
    while (running) {
      console.log('─── Menu ───────────────────────────────────────────────────────');
      console.log('  1. Mint a virtual card');
      console.log('  2. Spend from virtual card');
      console.log('  3. View current card (private state)');
      console.log('  4. Exit\n');

      const choice = await rl.question('  Your choice: ');

      switch (choice.trim()) {
        case '1': {
          const limitStr = await rl.question('  Enter spend limit (e.g. 100): ');
          const limit = BigInt(limitStr);
          // 24 hours from now
          const expiry = BigInt(Math.floor(Date.now() / 1000) + 86400); 
          const nullifierSeed = new Uint8Array(randomBytes(32));

          console.log('\n  Generating proof and submitting mintCard transaction...');
          try {
            const tx = await deployed.callTx.mintCard(limit, expiry, nullifierSeed);
            console.log(`\n  ✅ Virtual card minted!`);
            console.log(`  Transaction ID: ${tx.public.txId}`);
            
            // Note: tx.private.result contains the return value of mintCard circuit (the commitment)
            const returnedCommitment = tx.private.result;
            currentCard = {
              commitment: returnedCommitment,
              limit,
              expiry,
              seed: nullifierSeed
            };
            
            console.log(`  Card Commitment: ${Buffer.from(returnedCommitment).toString('hex')}\n`);
          } catch (error) {
            console.error('\n  ❌ Failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '2': {
          if (!currentCard) {
            console.log('\n  ❌ Mint a card first.\n');
            break;
          }
          const amountStr = await rl.question('  Enter amount to spend: ');
          const amount = BigInt(amountStr);
          const currentTime = BigInt(Math.floor(Date.now() / 1000));

          console.log('\n  Generating proof and submitting spend transaction...');
          try {
            const tx = await deployed.callTx.spend(
              currentCard.commitment, 
              amount, 
              currentCard.limit, 
              currentCard.expiry, 
              currentCard.seed, 
              currentTime
            );
            console.log(`\n  ✅ Spend approved!`);
            console.log(`  Transaction ID: ${tx.public.txId}\n`);
          } catch (error) {
            console.error('\n  ❌ Spend Denied/Failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '3': {
          if (currentCard) {
             console.log(`\n  [PRIVATE STATE]`);
             console.log(`  Limit: ${currentCard.limit}`);
             console.log(`  Expiry (timestamp): ${currentCard.expiry}`);
             console.log(`  Seed: ${Buffer.from(currentCard.seed).toString('hex')}`);
             console.log(`  Commitment: ${Buffer.from(currentCard.commitment).toString('hex')}\n`);
          } else {
             console.log('\n  No card minted yet.\n');
          }
          break;
        }

        case '4':
          running = false;
          console.log('\n  👋 Goodbye!\n');
          break;

        default:
          console.log('\n  ❌ Invalid choice. Please enter 1-4.\n');
      }
    }

    await persistWalletState(network, walletCtx);
    await walletCtx.wallet.stop();
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
