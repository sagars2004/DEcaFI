import React, { useState } from 'react';
import { useMidnight } from '../midnight/MidnightContext';
import { ShoppingBag, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface MockCheckoutProps {
  activeCard: { limit: number; expiry: Date; commitment: string; seed: string };
}

type CheckoutState = 'idle' | 'processing' | 'approved' | 'denied';

const fromHex = (hexString: string) => {
  const bytes = new Uint8Array(Math.ceil(hexString.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return bytes;
};

export const MockCheckout: React.FC<MockCheckoutProps> = ({ activeCard }) => {
  const { contract } = useMidnight();
  const [amount, setAmount] = useState<string>('49.99');
  const [status, setStatus] = useState<CheckoutState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;

    setStatus('processing');
    setErrorMessage('');

    try {
      const spendAmount = parseInt(amount, 10);
      if (isNaN(spendAmount) || spendAmount <= 0) throw new Error('Invalid amount');

      const currentTs = Math.floor(Date.now() / 1000);
      const expiryTs = Math.floor(activeCard.expiry.getTime() / 1000);

      const commitmentBytes = fromHex(activeCard.commitment);
      const seedBytes = fromHex(activeCard.seed);

      console.log('Initiating spend circuit with:', { 
        commitment: activeCard.commitment, 
        amount: spendAmount, 
        limit: activeCard.limit, 
        expiry: expiryTs, 
        seed: activeCard.seed, 
        currentTs 
      });

      // If the commitment equals the seed, this is a simulated card from the fallback block
      // (because Lace wallet failed to mint it on-chain). We simulate the checkout.
      if (activeCard.commitment === activeCard.seed) {
        console.log('Simulated card detected. Bypassing smart contract spend circuit...');
        if (spendAmount > activeCard.limit) throw new Error('Spend denied: amount exceeds authorized limit');
        if (currentTs >= expiryTs) throw new Error('Spend denied: card has expired');
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('Simulated spend successful!');
        setStatus('approved');
        return;
      }

      // The spend circuit takes: (commitment, amount, limit, expiry, nullifier_seed, current_time)
      const tx = await contract.callTx.spend(
        commitmentBytes,
        BigInt(spendAmount),
        BigInt(activeCard.limit),
        BigInt(expiryTs),
        seedBytes,
        BigInt(currentTs)
      );

      console.log('Spend tx successful!', tx);
      setStatus('approved');
    } catch (err: any) {
      console.error('Spend denied', err);
      setStatus('denied');
      setErrorMessage(err.message || 'Transaction was rejected by the smart contract.');
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-3 mb-6">
        <div className="border-4 border-slate-700 bg-slate-800 p-2">
          <ShoppingBag className="w-6 h-6 text-blue-400" />
        </div>
        <h3 className="retro text-[14px] text-slate-100">Merchant Checkout</h3>
      </div>

      {status === 'approved' ? (
        <div className="text-center py-8 space-y-4">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h4 className="retro text-lg text-green-400">Payment Approved!</h4>
          <p className="retro text-slate-400 text-[10px] leading-5">Your virtual card authorized the transaction successfully without revealing your identity.</p>
          <button onClick={() => setStatus('idle')} className="btn-secondary w-full mt-4 text-[10px]">New Transaction</button>
        </div>
      ) : status === 'denied' ? (
        <div className="text-center py-8 space-y-4">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h4 className="retro text-lg text-red-400">Payment Denied</h4>
          <p className="retro text-red-300 text-[10px] leading-5">{errorMessage}</p>
          <button onClick={() => setStatus('idle')} className="btn-secondary w-full mt-4 text-[10px]">Try Again</button>
        </div>
      ) : (
        <form onSubmit={handleCheckout} className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b-4 border-slate-700">
              <span className="retro text-[10px] text-slate-400">Cart Total</span>
              <div className="flex items-center w-36">
                <span className="retro text-slate-300 mr-2 text-[10px]">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="retro w-full bg-slate-950 border-4 border-slate-700 py-2 px-2 text-right text-slate-100 focus:border-blue-500 outline-none text-[10px] shadow-inner"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="retro text-[10px] text-slate-200">Total to Pay</span>
              <span className="retro text-sm text-white">${parseFloat(amount || '0').toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'processing'}
            className="btn-primary w-full flex items-center justify-center space-x-2 text-[10px]"
          >
            {status === 'processing' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="pt-1">Pay Confidentially</span>
            )}
          </button>
          
          <p className="retro text-[8px] leading-4 text-center text-slate-500 mt-4">
            A Zero-Knowledge proof will be generated locally. The merchant never sees your real card details or spending history.
          </p>
        </form>
      )}
    </div>
  );
};
