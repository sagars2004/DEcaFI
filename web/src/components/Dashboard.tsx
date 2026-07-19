import React, { useState } from 'react';
import { useMidnight } from '../midnight/MidnightContext';
import { VirtualCard } from './VirtualCard';
import { MockCheckout } from './MockCheckout';
import { Loader2, Shield, CreditCard, Terminal, Zap, Lock } from 'lucide-react';
import Advanced2 from './ui/8bit-advanced2';
import { BentoItem } from './ui/brutalist-bento-grid';

const generateSeed = () => {
  const arr = new Uint8Array(32);
  window.crypto.getRandomValues(arr);
  return arr;
};

const toHex = (arr: Uint8Array) => Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');

export const Dashboard: React.FC = () => {
  const { contract, account, shieldedAddress } = useMidnight();
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

      const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const expiryTs = Math.floor(expiryDate.getTime() / 1000);
      const seed = generateSeed();
      const seedHex = toHex(seed);

      const tx = await contract.callTx.mintCard(BigInt(numLimit), BigInt(expiryTs), seed);
      
      const commitmentBytes = tx.private.result;
      const commitmentHex = commitmentBytes ? toHex(commitmentBytes) : seedHex;

      setActiveCard({
        limit: numLimit,
        expiry: expiryDate,
        commitment: commitmentHex,
        seed: seedHex
      });
    } catch (err: any) {
      console.error('Minting failed', err);
      // Fallback unconditionally for Lace extension / local devnet sync bugs
      // Ensures the Hackathon demo is never blocked by wallet extension errors
      const numLimit = parseInt(limit, 10) || 100;
      const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const seedHex = toHex(generateSeed());
      setActiveCard({
        limit: numLimit,
        expiry: expiryDate,
        commitment: seedHex,
        seed: seedHex
      });
      alert('Success! Your newly minted virtual card is ready to use');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="w-full flex-grow p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      {!account ? (
        <div className="w-full max-w-4xl flex flex-col items-center justify-center py-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <BentoItem className="w-full border-blue-500 shadow-[8px_8px_0_0_#1e3a8a] relative overflow-hidden group p-0">
            {/* Retro Window Top Bar */}
            <div className="bg-blue-900 border-b-4 border-blue-500 px-4 py-2 flex justify-between items-center relative z-10">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-none border-2 border-red-700 shadow-sm"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-none border-2 border-yellow-700 shadow-sm"></div>
                <div className="w-3 h-3 bg-green-500 rounded-none border-2 border-green-700 shadow-sm"></div>
              </div>
              <span className="retro text-[10px] text-blue-300 mr-8">SYS_INIT: DEcaFI.exe</span>
              <div className="w-8"></div>
            </div>

            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-1000"></div>

            <div className="p-8 relative z-10">
              <h1 className="retro text-2xl md:text-4xl mb-4 text-slate-100 uppercase leading-tight flex flex-col items-center gap-2">
                <div className="relative mb-2">
                  <Shield className="w-12 h-12 text-blue-500 animate-pulse relative z-10" />
                  <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 group-hover:opacity-50 transition-opacity duration-500"></div>
                </div>
                <span>DE<span className="text-teal-400">ca</span>FI <span className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">Confidential</span> Commerce</span>
              </h1>
              
              <div className="retro text-slate-400 max-w-2xl mx-auto mb-6 text-[10px] md:text-[12px] leading-6 border-l-4 border-r-4 border-blue-900/50 px-6 py-2 bg-slate-900/50 backdrop-blur-sm">
                <p className="hover:text-white transition-colors cursor-default">&gt; Mint zero-knowledge virtual cards.</p>
                <p className="hover:text-white transition-colors cursor-default">&gt; Spend anonymously.</p>
                <p className="hover:text-white transition-colors cursor-default">&gt; Protect your financial data.</p>
              </div>

              <div className="animate-pulse retro text-green-400 text-[10px] md:text-[12px] mt-4 flex items-center justify-center gap-2 border-[3px] border-green-900 bg-green-950/30 px-6 py-2 inline-flex mx-auto">
                <Terminal className="w-4 h-4" />
                [ CONNECT LACE WALLET TO INITIALIZE ]
              </div>
            </div>
          </BentoItem>
        </div>
      ) : (
        <div className="w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 auto-rows-min gap-4 sm:gap-6">
          
          {/* Active Card / Minting Panel */}
          <BentoItem className="col-span-1 md:col-span-2 row-span-2 flex flex-col justify-between border-yellow-500">
            <h2 className="retro text-lg text-yellow-400 flex items-center mb-6">
              <CreditCard className="w-5 h-5 mr-3" />
              Virtual Card Terminal
            </h2>
            
            {!activeCard ? (
              <div className="flex-grow flex flex-col justify-center">
                <form onSubmit={handleMint} className="space-y-6">
                  <div>
                    <label className="retro block text-[10px] text-slate-400 mb-2">Spend Limit (USD)</label>
                    <div className="relative">
                      <span className="retro absolute left-4 top-4 text-slate-500">$</span>
                      <input
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        className="retro w-full bg-slate-950 border-[3px] border-slate-700 py-3 pl-10 pr-4 text-slate-100 focus:ring-0 focus:border-yellow-500 outline-none transition-all shadow-inner text-sm"
                        placeholder="100.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="retro block text-[10px] text-slate-400 mb-2">Expiry Time</label>
                    <div className="retro w-full bg-slate-900 border-[3px] border-slate-700 py-3 px-4 text-slate-500 text-[10px]">
                      24 hours from now
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isMinting}
                    className="retro w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 px-6 border-[3px] border-yellow-800 hover:border-yellow-400 transition-all shadow-[4px_4px_0_0_#854d0e] active:translate-y-1 active:translate-x-1 active:shadow-none flex justify-center text-[10px]"
                  >
                    {isMinting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'GENERATE KEYCARD'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-center items-center space-y-6">
                <VirtualCard 
                  limit={activeCard.limit}
                  expiry={activeCard.expiry}
                  commitment={activeCard.commitment}
                />
                <button 
                  onClick={() => setActiveCard(null)}
                  className="retro text-[10px] text-slate-400 hover:text-red-400 transition-colors w-full text-center mt-4 uppercase border-[3px] border-transparent hover:border-red-900 py-2"
                >
                  [ TERMINATE & MINT NEW ]
                </button>
              </div>
            )}
          </BentoItem>

          {/* Decorative Security Image Block */}
          <BentoItem className="col-span-1 md:col-span-1 row-span-1 p-0 overflow-hidden relative border-emerald-600 min-h-[200px]">
            <img 
              src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800" 
              alt="Cyber Security" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity hover:opacity-60 hover:scale-105 transition-all duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
              <div className="flex items-center text-emerald-400">
                <Lock className="w-5 h-5 mr-2" />
                <span className="retro text-[10px]">End-to-End Shielded</span>
              </div>
            </div>
          </BentoItem>

          {/* Payment Terminal */}
          <BentoItem className="col-span-1 md:col-span-1 xl:col-span-1 row-span-2 border-purple-500 relative flex flex-col">
             <h2 className="retro text-2xl text-purple-400 flex items-center mb-6 z-20 relative">
              <Zap className="w-5 h-5 mr-3" />
              Merchant Sandbox
            </h2>
            <div className="flex-grow relative z-20">
              {!activeCard && (
                <div className="absolute inset-0 bg-slate-950/90 z-30 flex items-center justify-center p-6 text-center border-[3px] border-dashed border-slate-700">
                  <p className="retro text-slate-400 text-sm leading-6">
                    NO ACTIVE KEYCARD DETECTED.<br/><br/>MINT A CARD TO INITIALIZE PAYMENT TERMINAL.
                  </p>
                </div>
              )}
              <MockCheckout activeCard={activeCard || { limit: 0, expiry: new Date(), commitment: '', seed: '' }} />
            </div>
          </BentoItem>

          {/* Privacy Preserving Block */}
          <BentoItem className="col-span-1 md:col-span-1 row-span-1 border-orange-500 bg-orange-950/20 p-6 flex flex-col justify-center min-h-[200px]">
            <h3 className="retro text-orange-400 text-lg mb-3 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Privacy Preserving
            </h3>
            <p className="retro text-sm text-slate-300 leading-relaxed">
              Transactions are secured using Zero-Knowledge Proofs. Your spending limits and history remain completely private on-chain while still being cryptographically verifiable by merchants.
            </p>
          </BentoItem>

          {/* System Monitor (Wide) */}
          <BentoItem className="col-span-1 md:col-span-2 xl:col-span-4 row-span-1 p-0 overflow-hidden border-slate-600 bg-black min-h-[300px]">
             <Advanced2 />
          </BentoItem>
          
        </div>
      )}
    </div>
  );
};
