import React from 'react';
import { useMidnight } from '../midnight/MidnightContext';
import { Wallet, Loader2 } from 'lucide-react';

export const WalletConnect: React.FC = () => {
  const { account, isConnecting, connectWallet } = useMidnight();

  if (account) {
    return (
      <div className="flex items-center space-x-2 bg-slate-800 border-4 border-slate-700 px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <div className="w-3 h-3 bg-green-400 animate-pulse border-2 border-green-600" />
        <span className="retro text-xs text-slate-300 pt-1">
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
      <span className="pt-1">{isConnecting ? 'Connecting...' : 'Connect Lace'}</span>
    </button>
  );
};
