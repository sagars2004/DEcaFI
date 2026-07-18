import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CreditCard } from 'lucide-react';

interface VirtualCardProps {
  limit: number;
  expiry: Date;
  commitment: string;
}

export const VirtualCard: React.FC<VirtualCardProps> = ({ limit, expiry, commitment }) => {
  // Generate a display-only pseudo PAN based on the commitment hash (first 16 chars as digits)
  // This is purely for the demo UX; no real card info is derived this way.
  const numericCommitment = commitment.replace(/\D/g, '').padEnd(16, '0');
  const pseudoPan = `${numericCommitment.slice(0, 4)} ${numericCommitment.slice(4, 8)} ${numericCommitment.slice(8, 12)} ${numericCommitment.slice(12, 16)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: 90 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="relative w-96 h-56 rounded-2xl p-6 overflow-hidden shadow-2xl text-white transform-gpu"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-slate-900 opacity-90 z-0" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full mix-blend-overlay blur-3xl -translate-y-1/2 translate-x-1/2 z-0" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full mix-blend-overlay blur-2xl translate-y-1/4 -translate-x-1/4 z-0" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-green-300" />
            <span className="font-semibold text-green-300 uppercase tracking-wider text-sm">Protected</span>
          </div>
          <CreditCard className="w-8 h-8 text-white/50" />
        </div>

        <div className="mt-4">
          <div className="font-mono text-2xl tracking-widest text-slate-100 drop-shadow-md">
            {pseudoPan}
          </div>
        </div>

        <div className="flex justify-between items-end mt-4">
          <div>
            <div className="text-xs text-white/60 uppercase tracking-widest">Spend Limit</div>
            <div className="font-semibold text-lg text-white drop-shadow-md">${limit.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-white/60 uppercase tracking-widest">Expires</div>
            <div className="font-mono font-medium text-lg text-white drop-shadow-md">
              {expiry.toLocaleDateString(undefined, { month: '2-digit', year: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
