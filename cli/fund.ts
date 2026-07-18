import { WebSocket } from 'ws';
import { resolveNetwork, getOrCreateSeed } from './network';
import { MidnightBech32m, ShieldedAddress, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk/address-format';
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

  const parsedAddress = MidnightBech32m.parse(address);
  let decodedAddress;
  let addressType: 'shielded' | 'unshielded' = 'shielded';

  try {
    decodedAddress = parsedAddress.decode(UnshieldedAddress, network);
    addressType = 'unshielded';
  } catch (e) {
    decodedAddress = parsedAddress.decode(ShieldedAddress, network);
    addressType = 'shielded';
  }

  const recipe = await walletCtx.wallet.transferTransaction(
    [
      {
        type: addressType,
        outputs: [
          {
            type: unshieldedToken().raw, // Token ID for tNIGHT
            receiverAddress: decodedAddress as any,
            amount: 20_000_000_000n, // 20,000 tNIGHT
          },
        ],
      },
    ],
    { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
    { ttl: new Date(Date.now() + 3600000) }
  );

  const finalTx = await walletCtx.wallet.finalizeRecipe(recipe);
  const txId = await walletCtx.wallet.submitTransaction(finalTx);
  console.log(`Successfully transferred 20,000 tNIGHT to ${addressType} address! Transaction ID: ${txId}`);
  process.exit(0);
}

main().catch(console.error);
