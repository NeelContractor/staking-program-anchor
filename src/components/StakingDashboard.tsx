"use client"
import React from 'react';
import { motion } from 'framer-motion';
import WalletConnection from './WalletConnection';
import StakingCard from './StakingCard';
import { Coins } from 'lucide-react';

const StakingDashboard: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="pt-6 pb-4 px-6">
        <div className="flex justify-between items-center">
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-indigo-600 p-3 rounded-full mr-3">
              <Coins className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">SolStake</h1>
          </motion.div>
          <WalletConnection />
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <motion.div
          className="w-full max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StakingCard />
        </motion.div>
      </main>

      <footer className="py-6 px-6 text-center text-indigo-300 text-sm">
        <p>© 2025 SolStake. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default StakingDashboard;