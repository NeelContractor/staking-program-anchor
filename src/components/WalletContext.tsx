// "use client"
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
// import { 
//   ConnectionProvider, 
//   WalletProvider as SolanaWalletProvider,
//   useWallet as useSolanaWallet
// } from '@solana/wallet-adapter-react';
// import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// // Types
// type WalletContextType = {
//   connected: boolean;
//   publicKey: PublicKey | null;
//   connecting: boolean;
//   connectWallet: () => Promise<void>;
//   disconnectWallet: () => Promise<void>;
//   connection: Connection;
// };

// // Create context
// const WalletContext = createContext<WalletContextType | undefined>(undefined);

// // Create provider component
// export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   // For demo purposes, we're using devnet
//   const network = WalletAdapterNetwork.Devnet;
//   const endpoint = clusterApiUrl(network);
  

//   return (
//     <ConnectionProvider endpoint={endpoint}>
//       <SolanaWalletProvider wallets={[]} autoConnect>
//         <WalletContextContent>
//           {children}
//         </WalletContextContent>
//       </SolanaWalletProvider>
//     </ConnectionProvider>
//   );
// };

// // Context content component
// const WalletContextContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const { 
//     connected, 
//     publicKey, 
//     connecting, 
//     connect, 
//     disconnect, 
//     wallet 
//   } = useSolanaWallet();
  
//   const [connection] = useState(new Connection(clusterApiUrl('devnet')));

//   // Connect wallet
//   const connectWallet = async () => {
//     try {
//       if (wallet) {
//         await connect();
//       }
//     } catch (error) {
//       console.error('Failed to connect wallet:', error);
//     }
//   };

//   // Disconnect wallet
//   const disconnectWallet = async () => {
//     try {
//       await disconnect();
//     } catch (error) {
//       console.error('Failed to disconnect wallet:', error);
//     }
//   };

//   // Return context provider
//   return (
//     <WalletContext.Provider
//       value={{
//         connected,
//         publicKey,
//         connecting,
//         connectWallet,
//         disconnectWallet,
//         connection,
//       }}
//     >
//       {children}
//     </WalletContext.Provider>
//   );
// };

// // Custom hook to use wallet context
// export const useWallet = () => {
//   const context = useContext(WalletContext);
//   if (context === undefined) {
//     throw new Error('useWallet must be used within a WalletProvider');
//   }
//   return context;
// };