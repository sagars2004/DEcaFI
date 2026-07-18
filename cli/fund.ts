import { WebSocket } from 'ws';
import { resolveNetwork, getOrCreateSeed } from './network';
import { createWallet, unshieldedToken } from './wallet';

globalThis.WebSocket = WebSocket as any;

async function main() {
  const address = process.argv[2];
  if (!address) {
    console.error('Usage: npx tsx cli/fund.ts <address>');
    process.exit(1);
  }

  const { network, config: networkConfig } = resolveNetwork();
  const seed = getOrCreateSeed(network);
  
  console.log(`Funding ${address} on ${network} from genesis wallet...`);

  const walletCtx = await createWallet({ network, networkConfig, seed });
  await walletCtx.wallet.waitForSyncedState();

  const recipe = await walletCtx.wallet.transferTransaction(
    [
      {
        type: 'unshielded',
        outputs: [
          {
            type: unshieldedToken(),
            receiverAddress: address,
            amount: 1000n, // 1000 tNIGHT
          },
        ],
      },
    ],
    { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
    { ttl: new Date(Date.now() + 3600000) }
  );

  const finalTx = await walletCtx.wallet.finalizeRecipe(recipe);
  const txId = await walletCtx.wallet.submitTransaction(finalTx);
  console.log(`Successfully transferred 1000 tNIGHT! Transaction ID: ${txId}`);
  process.exit(0);
}

main().catch(console.error);
