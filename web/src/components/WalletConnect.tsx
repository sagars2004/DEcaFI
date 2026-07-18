import React from 'react';
import { useMidnight } from '../midnight/MidnightContext';
import { Wallet, Loader2 } from 'lucide-react';

export const WalletConnect: React.FC = () => {
  const { account, isConnecting, connectWallet } = useMidnight();

  if (account) {
    return (
      <div className="flex items-center space-x-2 bg-slate-800/80 backdrop-blur border border-slate-700/50 px-4 py-2 rounded-full shadow-lg">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-sm font-medium font-mono text-slate-300">
          {account.slice(0, 8)}...{account.slice(-6)}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="btn-primary flex items-center space-x-2"
    >
      {isConnecting ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Wallet className="w-5 h-5" />
      )}
      <span>{isConnecting ? 'Connecting...' : 'Connect Lace'}</span>
    </button>
  );
};
