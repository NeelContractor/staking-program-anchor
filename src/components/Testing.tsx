"use client"
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
// import { StakingAccountProvider, useStaking, useStakingAccount } from './StakingContext';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Coins, CoinsIcon, Award, RefreshCw, FolderPlus } from 'lucide-react';
import ActionButton from './ActionButton';
import StakingInput from './StakingInput';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useStakeProgram, useStakeProgramAccount } from './stake/counter-data-access';
import { STAKE_PROGRAM_ID } from '@project/anchor';

const TestingCard: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const [isPdaCreated, setIsPdaCreated] = useState(false);
  const [balance, setBalance] = useState<number>();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pdaAccount, setPdaAccount] = useState<PublicKey | null>(null);
  
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const { create_pda_account, accounts } = useStakeProgram();

  // Fixed: Use useEffect instead of setInterval for balance updates
  useEffect(() => {
    const GetBalance = async() => {
      if (!publicKey) return;
      try {
        const bal = await connection.getBalance(publicKey);
        setBalance(bal);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    GetBalance();
    
    // Set up interval for periodic updates
    const interval = setInterval(GetBalance, 15000);
    return () => clearInterval(interval);
  }, [publicKey, connection]);

  // Fixed: Check if PDA account actually exists on-chain
  useEffect(() => {
    const checkPdaExists = async () => {
      if (!publicKey) return;
      
      try {
        const [pdaAddress] = PublicKey.findProgramAddressSync(
          [Buffer.from("client1"), publicKey.toBuffer()],
          STAKE_PROGRAM_ID
        );
        
        // Actually check if the account exists on-chain
        const accountInfo = await connection.getAccountInfo(pdaAddress);
        const exists = accountInfo !== null;
        
        setIsPdaCreated(exists);
        setPdaAccount(pdaAddress);
      } catch (error) {
        console.error('Error checking PDA existence:', error);
        setIsPdaCreated(false);
      }
    };
    
    checkPdaExists();
  }, [publicKey, connection]);

  const handleCreatePda = async () => {
    if (!publicKey) return;

    try {
      const [pdaAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("client1"), publicKey.toBuffer()],
        STAKE_PROGRAM_ID
      );

      // Check if account already exists
      const accountInfo = await connection.getAccountInfo(pdaAddress);
      
      if (accountInfo) {
        showNotification('PDA account already exists', 'error');
        setIsPdaCreated(true);
        return;
      }

      // Create the PDA account
      const success = await create_pda_account.mutateAsync({ payer: publicKey });
      
      if (success) {
        setPdaAccount(pdaAddress);
        setIsPdaCreated(true);
        showNotification('Successfully created PDA account', 'success');
      } else {
        showNotification('Failed to create PDA account', 'error');
      }
    } catch (error) {
      console.error('Error creating PDA:', error);
      showNotification('Failed to create PDA account', 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto bg-gray-800 bg-opacity-40 backdrop-blur-lg p-8 rounded-2xl 
                shadow-2xl border border-indigo-500/20"
    >
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Solana Staking</h2>
      
      {!connected ? (
        <div className="text-center py-8">
          <p className="text-indigo-300 mb-4">Please connect your wallet to start staking</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-700 bg-opacity-50 p-4 rounded-xl">
              <h3 className="text-indigo-300 text-sm mb-1">Available Balance</h3>
              <p className="text-2xl font-bold text-white">{(balance ?? 0) / LAMPORTS_PER_SOL} SOL</p>
            </div>
            
            <div className="bg-gray-700 bg-opacity-50 p-4 rounded-xl">
              <h3 className="text-indigo-300 text-sm mb-1">PDA Account</h3>
              <p className="text-lg font-bold text-white">
                {isPdaCreated ? (
                  <span className="text-green-400">Created</span>
                ) : (
                  <span className="text-red-400">Not Created</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex mb-8">
            <ActionButton
              onClick={handleCreatePda}
              loading={create_pda_account.isPending}
              icon={<FolderPlus className="mr-2 h-5 w-5" />}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600"
              disabled={isPdaCreated}
            >
              Create PDA
            </ActionButton>
          </div>

          {/* Fixed: Simplified conditional rendering and removed duplicate/conflicting JSX */}
          {accounts.isLoading ? (
            <div className="text-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : accounts.data?.length ? (
            <div className="grid gap-4 md:grid-cols-1">
              {accounts.data.map((account) => (
                <StakeAccountCard
                  key={account.publicKey.toString()}
                  account={account.publicKey}
                />
              ))}
            </div>
          ) : isPdaCreated ? (
            <div className="text-center py-8">
              <p className="text-indigo-300">No staking accounts found. The PDA might need time to sync.</p>
            </div>
          ) : null}

          {/* Display notification */}
          {notification && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                notification.type === 'success' 
                  ? 'bg-green-900/40 border border-green-500/30' 
                  : 'bg-red-900/40 border border-red-500/30'
              }`}
            >
              <p className={`text-sm ${
                notification.type === 'success' ? 'text-green-300' : 'text-red-300'
              }`}>
                {notification.message}
              </p>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

function StakeAccountCard({ account }: { account: PublicKey }) {
  const [stakeAmount, setStakeAmount] = useState<number>(0);
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [unstakeAmount, setUnstakeAmount] = useState<number>(0);
  const [balance, setBalance] = useState<number>();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { stake, unstake, claim_points, get_points, accountQuery } = useStakeProgramAccount({ account });

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    const GetBalance = async() => {
      if (!publicKey) return;
      try {
        const bal = await connection.getBalance(publicKey);
        setBalance(bal);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };
    GetBalance();
  }, [publicKey, connection]);

  const handleStake = async () => {
    if (stakeAmount <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }
    
    if (!publicKey) return;

    try {
      const success = await stake.mutateAsync({ amount: stakeAmount * LAMPORTS_PER_SOL, payer: publicKey });
      if (success) {
        showNotification(`Successfully staked ${stakeAmount} SOL`, 'success');
        setStakeAmount(0);
      } else {
        showNotification('Failed to stake', 'error');
      }
    } catch (error) {
      console.error('Stake error:', error);
      showNotification('Failed to stake', 'error');
    }
  };

  const handleUnstake = async () => {
    if (unstakeAmount <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }
    
    if (!publicKey) return;

    try {
      const success = await unstake.mutateAsync({ amount: unstakeAmount * LAMPORTS_PER_SOL, payer: publicKey });
      if (success) {
        showNotification(`Successfully unstaked ${unstakeAmount} SOL`, 'success');
        setUnstakeAmount(0);
      } else {
        showNotification('Failed to unstake', 'error');
      }
    } catch (error) {
      console.error('Unstake error:', error);
      showNotification('Failed to unstake', 'error');
    }
  };

  const handleClaimPoints = async () => {
    if (!publicKey) return;

    try {
      const success = await claim_points.mutateAsync({ payer: publicKey, signTransaction });
      if (success) {
        showNotification('Successfully claimed points', 'success');
      } else {
        showNotification('Failed to claim points', 'error');
      }
    } catch (error) {
      console.error('Claim points error:', error);
      showNotification('Failed to claim points', 'error');
    }
  };

  const handleGetPoints = async () => {
    if (!publicKey) return;

    try {
      const pointsBalance = await get_points.mutateAsync({ payer: publicKey });
      showNotification(`Your points balance: ${pointsBalance}`, 'success');
    } catch (error) {
      console.error('Get points error:', error);
      showNotification('Failed to get points', 'error');
    }
  };

  if (accountQuery.isLoading) {
    return (
      <div className="text-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 bg-opacity-30 p-6 rounded-xl border border-indigo-500/20">
      <h3 className="text-xl font-semibold text-white mb-6 text-center">Staking Account</h3>
      
      {/* Account Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-700 bg-opacity-50 p-4 rounded-xl">
          <h4 className="text-indigo-300 text-sm mb-1">Staked Amount</h4>
          <p className="text-2xl font-bold text-white">
            {(accountQuery.data?.stakedAmount?.toNumber?.() ?? 0) / LAMPORTS_PER_SOL} SOL
          </p>
        </div>
        <div className="bg-gray-700 bg-opacity-50 p-4 rounded-xl">
          <h4 className="text-indigo-300 text-sm mb-1">Reward Points</h4>
          <p className="text-2xl font-bold text-white">
            {accountQuery.data?.totalPoints?.toNumber?.() ?? 0} pts
          </p>
        </div>
      </div>

      {/* Staking and Unstaking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Stake SOL</h4>
          <StakingInput
            value={stakeAmount}
            onChange={setStakeAmount}
            max={balance ?? 0}
            disabled={stake.isPending}
          />
          <ActionButton
            onClick={handleStake}
            loading={stake.isPending}
            icon={<Coins className="mr-2 h-5 w-5" />}
            className="w-full mt-3 bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            Stake
          </ActionButton>
        </div>
        
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Unstake SOL</h4>
          <StakingInput
            value={unstakeAmount}
            onChange={setUnstakeAmount}
            max={accountQuery?.data?.stakedAmount?.toNumber?.() ?? 0}
            disabled={unstake.isPending}
          />
          <ActionButton
            onClick={handleUnstake}
            loading={unstake.isPending}
            icon={<CoinsIcon className="mr-2 h-5 w-5" />}
            className="w-full mt-3 bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            Unstake
          </ActionButton>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <ActionButton
          onClick={handleClaimPoints}
          loading={claim_points.isPending}
          icon={<Award className="mr-2 h-5 w-5" />}
          className="bg-gradient-to-r from-emerald-600 to-teal-600"
          disabled={claim_points.isPending} // (accountQuery.data?.stakedAmount?.toNumber?.() ?? 0) <= 0
        >
          Claim Points
        </ActionButton>
        
        <ActionButton
          onClick={handleGetPoints}
          loading={get_points.isPending}
          icon={<RefreshCw className="mr-2 h-5 w-5" />}
          className="bg-gradient-to-r from-blue-600 to-indigo-600"
        >
          Get Points
        </ActionButton>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-900/40 border border-green-500/30' 
              : 'bg-red-900/40 border border-red-500/30'
          }`}
        >
          <p className={`text-sm ${
            notification.type === 'success' ? 'text-green-300' : 'text-red-300'
          }`}>
            {notification.message}
          </p>
        </div>
      )}
    </div>
  );
}

export default TestingCard;