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
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const mnWindow = (window as any).midnight;
      if (!mnWindow?.mnLace) {
        throw new Error('Lace wallet extension not found. Please install Lace with Midnight support.');
      }

      // 1. Connect to Lace Wallet
      const laceWallet = await mnWindow.mnLace.enable();
      setWallet(laceWallet);

      // We can grab the first available account
      const accounts = await laceWallet.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in Lace wallet.');
      }
      setAccount(accounts[0].address);

      // 2. Set up the providers
      const zkConfigProvider = new FetchZkConfigProvider(window.location.origin + '/mask', fetch.bind(window));
      
      const p: MidnightProviders = {
        privateStateProvider: levelPrivateStateProvider({
          privateStateStoreName: 'decafi-state',
          accountId: accounts[0].address,
          privateStoragePasswordProvider: () => 'Local-Devnet-Development-Placeholder-1', // Match backend dev password
        }),
        publicDataProvider: indexerPublicDataProvider(NETWORK_CONFIG.indexer, NETWORK_CONFIG.indexerWS),
        zkConfigProvider,
        proofProvider: httpClientProofProvider(NETWORK_CONFIG.proofServer, zkConfigProvider),
        walletProvider: laceWallet,
        midnightProvider: laceWallet, // the SDK requires this field too
      };
      setProviders(p);

      // 3. Connect to the Contract
      const compiledContract = CompiledContract.make('mask', MaskContract.Contract).pipe(
        CompiledContract.withVacantWitnesses,
      );

      const contractHandle = await findDeployedContract(p, {
        contractAddress: CONTRACT_ADDRESS,
        compiledContract: compiledContract as any,
        privateStateId: 'decafiPrivateState',
        initialPrivateState: {},
      });

      setContract(contractHandle);
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || String(err));
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <MidnightContext.Provider value={{ wallet, providers, contract, account, isConnecting, error, connectWallet }}>
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
