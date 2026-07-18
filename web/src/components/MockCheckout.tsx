import React, { useState } from 'react';
import { useMidnight } from '../midnight/MidnightContext';
import { ShoppingBag, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface MockCheckoutProps {
  activeCard: { limit: number; expiry: Date; commitment: string; seed: string };
}

type CheckoutState = 'idle' | 'processing' | 'approved' | 'denied';

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

      console.log('Initiating spend circuit with:', { 
        commitment: activeCard.commitment, 
        amount: spendAmount, 
        limit: activeCard.limit, 
        expiry: expiryTs, 
        seed: activeCard.seed, 
        currentTs 
      });

      // The spend circuit takes: (commitment, amount, limit, expiry, nullifier_seed, current_time)
      // The commitment is public. The rest are private variables used to generate the proof.
      const tx = await contract.callTx.spend(
        activeCard.commitment,
        BigInt(spendAmount),
        BigInt(activeCard.limit),
        BigInt(expiryTs),
        activeCard.seed,
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
        <div className="bg-blue-500/20 p-3 rounded-xl">
          <ShoppingBag className="w-6 h-6 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-100">Merchant Checkout</h3>
      </div>

      {status === 'approved' ? (
        <div className="text-center py-8 space-y-4">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
          <h4 className="text-2xl font-bold text-slate-100">Payment Approved!</h4>
          <p className="text-slate-400 text-sm">Your virtual card authorized the transaction successfully without revealing your identity.</p>
          <button onClick={() => setStatus('idle')} className="btn-secondary mt-4">New Transaction</button>
        </div>
      ) : status === 'denied' ? (
        <div className="text-center py-8 space-y-4">
          <XCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h4 className="text-2xl font-bold text-slate-100">Payment Denied</h4>
          <p className="text-red-300 text-sm">{errorMessage}</p>
          <button onClick={() => setStatus('idle')} className="btn-secondary mt-4">Try Again</button>
        </div>
      ) : (
        <form onSubmit={handleCheckout} className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-700">
              <span className="text-slate-400">Cart Total</span>
              <div className="flex items-center w-32">
                <span className="text-slate-300 mr-2">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1 px-2 text-right text-slate-100 focus:ring-1 focus:ring-blue-500 outline-none"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-200 font-medium">Total to Pay</span>
              <span className="text-2xl font-bold text-white">${parseFloat(amount || '0').toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'processing'}
            className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {status === 'processing' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>Pay Confidentially</span>
            )}
          </button>
          
          <p className="text-xs text-center text-slate-500 mt-4">
            A Zero-Knowledge proof will be generated locally. The merchant never sees your real card details or spending history.
          </p>
        </form>
      )}
    </div>
  );
};
