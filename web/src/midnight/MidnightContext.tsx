import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

import { NETWORK_CONFIG, CONTRACT_ADDRESS } from './config';
// We copy the contract folder locally and import it
import * as MaskContract from '../contracts/mask/contract';

export type MidnightProviders = {
  privateStateProvider: any;
  publicDataProvider: any;
  zkConfigProvider: any;
  proofProvider: any;
  walletProvider: any;
  midnightProvider: any;
};

interface MidnightContextType {
  wallet: any | null;
  providers: MidnightProviders | null;
  contract: any | null; // the mask contract handle
  account: string | null;
  shieldedAddress: string | null;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
}

const MidnightContext = createContext<MidnightContextType | undefined>(undefined);

export const MidnightProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<any | null>(null);
  const [providers, setProviders] = useState<MidnightProviders | null>(null);
  const [contract, setContract] = useState<any | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [shieldedAddress, setShieldedAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const mnWindow = (window as any).midnight;
      if (!mnWindow) {
        throw new Error('Midnight wallet extension not found. Please install Lace with Midnight support.');
      }

      // Lace might inject as `lace` or `mnLace`
      const walletKey = Object.keys(mnWindow).find(k => mnWindow[k].enable || mnWindow[k].connect);
      if (!walletKey) {
        throw new Error(`Wallet API not found in window.midnight. (Available: ${Object.keys(mnWindow).join(', ')})`);
      }

      const walletApi = mnWindow[walletKey];
      // 1. Connect to Lace Wallet
      const laceWallet = walletApi.enable ? await walletApi.enable() : await walletApi.connect('undeployed');
      setWallet(laceWallet);

      // Set the global network ID required by midnight-js v4+
      const { setNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
      try {
        setNetworkId('undeployed'); 
      } catch (e) {
        // In case it's already set or fails, we can ignore or log.
        console.warn('setNetworkId error:', e);
      }

      const addressObj = await laceWallet.getUnshieldedAddress();
      if (!addressObj?.unshieldedAddress) {
        throw new Error('No unshielded address found in Lace wallet.');
      }
      setAccount(addressObj.unshieldedAddress);

      const shieldedAddresses = await laceWallet.getShieldedAddresses();
      if (shieldedAddresses?.shieldedAddress) {
        setShieldedAddress(shieldedAddresses.shieldedAddress);
      }

      const customWalletProvider = {
        getCoinPublicKey: () => shieldedAddresses.shieldedCoinPublicKey,
        getEncryptionPublicKey: () => shieldedAddresses.shieldedEncryptionPublicKey,
        balanceTx: async (tx: any) => {
           try {
             let txBytes;
             try {
               const { getNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
               txBytes = tx.serialize(getNetworkId());
             } catch(e) {
               txBytes = tx.serialize();
             }
             const { toHex, fromHex } = await import('@midnight-ntwrk/midnight-js-utils');
             const txHex = toHex(txBytes);
             console.log("Calling laceWallet.balanceUnsealedTransaction...");
             const balanced = await laceWallet.balanceUnsealedTransaction(txHex);
             console.log("balanceUnsealedTransaction succeeded!");
             return {
               txHex: balanced.tx,
               serialize: () => fromHex(balanced.tx) 
             };
           } catch (error: any) {
             console.error("balanceTx failed:", error);
             throw new Error(`balanceTx failed: ${error?.message || error}`);
           }
        }
      };

      const customMidnightProvider = {
        submitTx: async (finalizedTx: any) => {
           const { toHex, fromHex } = await import('@midnight-ntwrk/midnight-js-utils');
           let txHex = finalizedTx.txHex;
           if (!txHex) {
             const { getNetworkId } = await import('@midnight-ntwrk/midnight-js-network-id');
             try {
                txHex = toHex(finalizedTx.serialize(getNetworkId()));
             } catch(e) {
                txHex = toHex(finalizedTx.serialize());
             }
           }
           try {
             // We'll submit it directly to the node to bypass Lace's internal FiberFailure bugs
             console.log("Submitting transaction directly to node via RPC...");
             const txHexWithPrefix = txHex.startsWith('0x') ? txHex : '0x' + txHex;
             const rpcResponse = await fetch('http://127.0.0.1:9944', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                   jsonrpc: '2.0',
                   id: 1,
                   method: 'author_submitExtrinsic',
                   params: [txHexWithPrefix]
                })
             });
             const rpcResult = await rpcResponse.json();
             if (rpcResult.error) {
                 throw new Error(rpcResult.error.message || JSON.stringify(rpcResult.error));
             }
             console.log("Direct RPC submit succeeded! Tx hash:", rpcResult.result);
             
             let txId = "0000000000000000000000000000000000000000000000000000000000000000";
             try {
               const { Transaction } = await import('@midnight-ntwrk/ledger-v8');
               const deserialized = Transaction.deserialize('signature', 'proof', 'binding', fromHex(txHex));
               const ids = deserialized.identifiers();
               if (ids && ids.length > 0) {
                 txId = ids[ids.length - 1];
               }
             } catch (err) {
               console.error("Failed to deserialize transaction hex to extract txId:", err);
             }
             return txId;
           } catch (error: any) {
             console.error("RPC submit failed:", error);
             throw new Error(`Direct submit failed: ${error?.message || error}`);
           }
        }
      };

      // 2. Set up the providers
      const zkConfigProvider = new FetchZkConfigProvider(window.location.origin + '/mask', fetch.bind(window));
      
      const p: MidnightProviders = {
        privateStateProvider: levelPrivateStateProvider({
          privateStateStoreName: 'decafi-state-v2',
          accountId: addressObj.unshieldedAddress,
          privateStoragePasswordProvider: () => 'Local-Devnet-Development-Placeholder-1', // Match backend dev password
        }),
        publicDataProvider: indexerPublicDataProvider(NETWORK_CONFIG.indexer, NETWORK_CONFIG.indexerWS),
        zkConfigProvider,
        proofProvider: httpClientProofProvider(NETWORK_CONFIG.proofServer, zkConfigProvider),
        walletProvider: customWalletProvider,
        midnightProvider: customMidnightProvider,
      };
      setProviders(p);

      // 3. Connect to the Contract
      const compiledContract = CompiledContract.make('mask', MaskContract.Contract).pipe(
        CompiledContract.withVacantWitnesses,
      );

      console.log('Using contract address:', CONTRACT_ADDRESS);
      const contractHandle = await findDeployedContract(p, {
        contractAddress: CONTRACT_ADDRESS,
        compiledContract: compiledContract as any,
        privateStateId: 'decafiPrivateState-v2',
        initialPrivateState: {},
      });

      setContract(contractHandle);
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      const msg = err.message || String(err);
      setError(msg);
      alert(`Wallet Connection Failed: ${msg}`);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <MidnightContext.Provider value={{ wallet, providers, contract, account, shieldedAddress, isConnecting, error, connectWallet }}>
      {children}
    </MidnightContext.Provider>
  );
};

export const useMidnight = () => {
  const context = useContext(MidnightContext);
  if (context === undefined) {
    throw new Error('useMidnight must be used within a MidnightProvider');
  }
  return context;
};
