import React, { useState } from 'react';
import { useMidnight } from '../midnight/MidnightContext';
import { VirtualCard } from './VirtualCard';
import { MockCheckout } from './MockCheckout';
import { Loader2 } from 'lucide-react';
import Advanced2 from './ui/8bit-advanced2';
const generateSeed = () => {
  const arr = new Uint8Array(32);
  window.crypto.getRandomValues(arr);
  return arr;
};

const toHex = (arr: Uint8Array) => Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');

export const Dashboard: React.FC = () => {
  const { contract, account } = useMidnight();
  const [limit, setLimit] = useState<string>('100');
  const [isMinting, setIsMinting] = useState(false);
  const [activeCard, setActiveCard] = useState<{ limit: number; expiry: Date; commitment: string; seed: string } | null>(null);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !account) return;

    setIsMinting(true);
    try {
      const numLimit = parseInt(limit, 10);
      if (isNaN(numLimit) || numLimit <= 0) throw new Error('Invalid limit');

      // Expiry defaults to 24 hours from now in this demo (represented as unix timestamp)
      const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const expiryTs = Math.floor(expiryDate.getTime() / 1000);
      const seed = generateSeed();
      const seedHex = toHex(seed);

      console.log('Initiating mintCard circuit with:', { numLimit, expiryTs, seedHex });

      const tx = await contract.callTx.mintCard(BigInt(numLimit), BigInt(expiryTs), seed);
      
      console.log('Mint tx successful!', tx);
      
      // The circuit actually returns the commitment bytes, we can use it!
      const commitmentBytes = tx.public.result;
      const commitmentHex = commitmentBytes ? toHex(commitmentBytes) : seedHex;

      setActiveCard({
        limit: numLimit,
        expiry: expiryDate,
        commitment: commitmentHex,
        seed: seedHex
      });
    } catch (err) {
      console.error('Minting failed', err);
      alert('Failed to mint card. Check console for details.');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="mb-12 border border-slate-700/50 rounded-2xl overflow-hidden glass-panel retro dark">
        <Advanced2 />
      </div>
      
      {!account ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-3xl font-bold mb-4 text-slate-100">Welcome to DEcaFI</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-8">
            Confidential virtual cards for decentralized finance. Connect your Lace wallet to mint a single-use card.
          </p>
        </div>
      ) : !activeCard ? (
        <div className="glass-panel p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-slate-100">Mint Virtual Card</h2>
          <form onSubmit={handleMint} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Spend Limit (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-500">$</span>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="100.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Expiry Time</label>
              <div className="w-full bg-slate-800/30 border border-slate-700/50 rounded-xl py-3 px-4 text-slate-500">
                24 hours from now
              </div>
            </div>

            <button
              type="submit"
              disabled={isMinting}
              className="btn-primary w-full flex justify-center"
            >
              {isMinting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Confidential Card'}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-slate-200">Your Active Card</h3>
              <VirtualCard 
                limit={activeCard.limit}
                expiry={activeCard.expiry}
                commitment={activeCard.commitment}
              />
            </div>
            <button 
              onClick={() => setActiveCard(null)}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Mint another card
            </button>
          </div>

          <div className="glass-panel p-8 border-t-4 border-t-blue-500">
            <MockCheckout activeCard={activeCard} />
          </div>
        </div>
      )}
    </div>
  );
};
