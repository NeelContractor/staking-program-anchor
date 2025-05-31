"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { truncateAddress } from '../utils/format';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const WalletConnection: React.FC = () => {
  const { connected, publicKey } = useWallet();

  return (
    <div className="flex justify-end p-4">
      {!connected ? (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <WalletMultiButton />
        </motion.div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-md px-4 py-2 rounded-lg border border-indigo-500/20">
            <span className="text-indigo-300 text-sm mr-2">Connected:</span>
            <span className="text-white font-medium">{truncateAddress(publicKey?.toString() || '')}</span>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <WalletMultiButton />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;