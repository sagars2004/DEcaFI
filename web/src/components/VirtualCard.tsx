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
      className="relative w-96 h-56 border-4 border-slate-500 bg-slate-800 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] text-white transform-gpu"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-slate-800 z-0" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-green-400" />
            <span className="retro text-green-400 uppercase text-[10px]">Protected</span>
          </div>
          <CreditCard className="w-8 h-8 text-slate-500" />
        </div>

        <div className="mt-4">
          <div className="retro text-lg text-slate-100">
            {pseudoPan}
          </div>
        </div>

        <div className="flex justify-between items-end mt-4">
          <div>
            <div className="retro text-[8px] text-slate-400 mb-2">Spend Limit</div>
            <div className="retro text-sm text-white">${limit.toFixed(2)}</div>
          </div>
          <div>
            <div className="retro text-[8px] text-slate-400 text-right mb-2">Expires</div>
            <div className="retro text-sm text-white text-right">
              {expiry.toLocaleDateString(undefined, { month: '2-digit', year: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
