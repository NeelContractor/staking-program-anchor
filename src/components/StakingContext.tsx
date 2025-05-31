// "use client"
// import React, { createContext, useContext, useState } from 'react';
// import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
// import { useConnection, useWallet } from '@solana/wallet-adapter-react';
// // import { useStakeProgram, useStakeProgramAccount } from './stake/counter-data-access';
// import { STAKE_PROGRAM_ID } from '@project/anchor';
// import { useStakeProgramAccount } from './stake/counter-data-access';
// // import { useWallet } from './WalletContext';

// // Mock staking program ID - this would be your actual program ID in production
// const STAKING_PROGRAM_ID = new PublicKey('HYBGGNMBs7ZUjeE5YBHV6iuaduc3PQVeWEAMuACUdbWz');

// // Types
// type StakingContextType = {
//   balance: number;
//   // stakedAmount: number;
//   loading: boolean;
//   pdaCreated: boolean;
//   // stake_fn: (amount: number) => Promise<boolean>;
//   // unstake_fn: (amount: number) => Promise<boolean>;
//   // claimPoints: () => Promise<boolean>;
//   // getPoints: () => Promise<number>;
//   createPdaAccount: () => Promise<boolean>;
//   GetBalance: () => Promise<number | false | undefined>;
// };

// type StakingAccountContextType = {
//   stakedAmount: number;
//   loading: boolean;
//   points: number;
//   balance: number;
//   GetBalance: () => Promise<number | false | undefined>;
//   stake_fn: (amount: number) => Promise<boolean>;
//   unstake_fn: (amount: number) => Promise<boolean>;
//   claimPoints: () => Promise<boolean>;
//   getPoints: () => Promise<number>;
// };

// // Create context
// const StakingContext = createContext<StakingContextType | undefined>(undefined);
// const StakingAccountContext = createContext<StakingAccountContextType | undefined>(undefined);

// // Create provider component
// export const StakingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { connected, publicKey } = useWallet();
//   const { connection } = useConnection();
//   const { create_pda_account } = useStakeProgram();
//   if (!publicKey) return null;
  
//   // States
//   const [balance, setBalance] = useState<number>(0); // Mock SOL balance
//   const [loading, setLoading] = useState<boolean>(false);
//   const [pdaCreated, setPdaCreated] = useState<boolean>(false);


//   const GetBalance = async() => {
//     if (!connected || !publicKey) return false;

//     const bal = await connection.getBalance(publicKey);
//     setBalance(bal);

//   }

//   // Create PDA account
//   const createPdaAccount = async (): Promise<boolean> => {
//     if (!connected || !publicKey) return false;
    
//     setLoading(true);
//     try {
//       const pda = PublicKey.findProgramAddressSync(
//         [Buffer.from('client1'), publicKey.toBuffer()],
//         STAKING_PROGRAM_ID
//       )[0];

//       const accountInfo = await connection.getAccountInfo(pda);

//       if (accountInfo !== null) {
//         console.log('PDA account already exists.');
//         setPdaCreated(true);
//         setLoading(false);
//         return true;
//       }

//       const res = await create_pda_account.mutateAsync({ payer: publicKey });
//       console.log(res);
      
//       setPdaCreated(true);
//       setLoading(false);
//       return true;
//     } catch (error) {
//       console.error('Creating PDA account failed:', error);
//       setLoading(false);
//       return false;
//     }
//   };

//   // Return context provider
//   return (
//     <StakingContext.Provider
//       value={{
//         balance,
//         loading,
//         pdaCreated,
//         createPdaAccount,
//         GetBalance
//       }}
//     >
//       {children}
//     </StakingContext.Provider>
//   );
// };

// export const StakingAccountProvider: React.FC<{ children: React.ReactNode, account: PublicKey }> = ({ children, account }) => { // i want this account input but how to take/ where to take it from?
//   const { connected, publicKey } = useWallet();
//   const { connection } = useConnection();
  
//   // States
//   const [balance, setBalance] = useState<number>();
//   const [stakedAmount, setStakedAmount] = useState<number>(0);
//   const [points, setPoints] = useState<number>(0);
//   const [loading, setLoading] = useState<boolean>(false);
//   const { stake, unstake, claim_points, get_points } = useStakeProgramAccount({ account });

//   const GetBalance = async() => {
//     if (!connected || !publicKey) return false;

//     const bal = await connection.getBalance(publicKey);
//     setBalance(bal);

//   }

//   // Stake tokens
//   const stake_fn = async (amount: number): Promise<boolean> => {
//     if (!connected || !publicKey) return false;
    
//     setLoading(true);
//     try {
//       const res = await stake.mutateAsync({ payer: publicKey, amount });
//       console.log(res);
      
//       setBalance(prev => prev - amount);
//       setStakedAmount(prev => prev + amount);
//       setLoading(false);
//       return true;
//     } catch (error) {
//       console.error('Staking failed:', error);
//       setLoading(false);
//       return false;
//     }
//   };

//   // Unstake tokens
//   const unstake_fn = async (amount: number): Promise<boolean> => {
//     if (!connected || !publicKey) return false;
    
//     setLoading(true);
//     try {
//       const res = await unstake.mutateAsync({ payer: publicKey, amount });
//       console.log(res);
      
//       setBalance(prev => prev + amount);
//       setStakedAmount(prev => prev - amount);
//       setLoading(false);
//       return true;
//     } catch (error) {
//       console.error('Unstaking failed:', error);
//       setLoading(false);
//       return false;
//     }
//   };

//   // Claim points
//   const claimPoints = async (): Promise<boolean> => {
//     if (!connected || !publicKey) return false;
    
//     setLoading(true);
//     try {
//       const res = await claim_points.mutateAsync({ payer: publicKey });
//       console.log(res);
      
//       const newPoints = Math.floor(stakedAmount * 0.1);
//       setPoints(prev => prev + newPoints);
//       setLoading(false);
//       return true;
//     } catch (error) {
//       console.error('Claiming points failed:', error);
//       setLoading(false);
//       return false;
//     }
//   };

//   // Get points balance
//   const getPoints = async (): Promise<number> => {
//     if (!connected || !publicKey) return 0;
    
//     setLoading(true);
//     try {
//       const res = await get_points.mutateAsync({ payer: publicKey });
//       console.log(res);
      
//       setLoading(false);
//       return points;
//     } catch (error) {
//       console.error('Getting points failed:', error);
//       setLoading(false);
//       return 0;
//     }
//   };

//   return (
//     <StakingAccountContext.Provider
      
//       value={{
//         balance,
//         stakedAmount,
//         GetBalance,
//         loading,
//         points,
//         stake_fn,
//         unstake_fn,
//         claimPoints,
//         getPoints,
//       }}
//     >
//       {children}
//     </StakingAccountContext.Provider>
//   );
// };

// // Custom hook to use staking context
// export const useStaking = () => {
//   const context = useContext(StakingContext);
//   if (context === undefined) {
//     throw new Error('useStaking must be used within a StakingProvider');
//   }
//   return context;
// };
// export const useStakingAccount = ({ account }: { account: PublicKey }) => {
//   // await StakingAccountProvider(account); how to do this
//   const context = useContext(StakingAccountContext);
//   if (context === undefined) {
//     throw new Error('useStakingAccount must be used within a StakingProvider');
//   }
//   return context;
// };
// // Mock implementation of useStakeProgram for demonstration purposes
// function useStakeProgram(): { create_pda_account: { mutateAsync: ({ payer }: { payer: PublicKey }) => Promise<any> } } {
//   // In a real implementation, this would interact with your staking program via Anchor or another framework.
//   return {
//     create_pda_account: {
//       mutateAsync: async ({ payer }: { payer: PublicKey }) => {
//         // Simulate network delay and successful PDA creation
//         await new Promise(resolve => setTimeout(resolve, 1000));
//         console.log(`PDA account created for payer: ${payer.toBase58()}`);
//         return { success: true, payer: payer.toBase58() };
//       }
//     }
//   };
// }
