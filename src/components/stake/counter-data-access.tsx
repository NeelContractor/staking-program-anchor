'use client'

import { getStakeProgram, getStakeProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import { BN } from 'bn.js'
import { MPL_TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata'

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

interface CreatePdaAccountProps {
  payer: PublicKey,
}
interface ClaimPoints {
  payer: PublicKey,
  signTransaction: (<T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>) | undefined
}
interface GetPoints {
  payer: PublicKey,
}

interface StakeProps {
  amount: number,
  payer: PublicKey
}

interface UnstakeProps {
  amount: number,
  payer: PublicKey
}

export function useStakeProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getStakeProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getStakeProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['stake_account', 'all', { cluster }],
    queryFn: () => program.account.stakeAccount.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const create_pda_account= useMutation<string, Error, CreatePdaAccountProps>({
    mutationKey: ['stake', 'create', { cluster }],
    mutationFn: async({ payer }) => {
      const pdaAccountPDA = await PublicKey.findProgramAddressSync(
        [Buffer.from("client1"), payer.toBuffer()],
        program.programId
      )[0];

      return program.methods
        .createPdaAccount()
        .accounts({ 
          payer: payer,
          pdaAccount: pdaAccountPDA
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }as any)
        .signers([])
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to creating PDA account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    create_pda_account,
  }
}

export function useStakeProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useStakeProgram()

  const accountQuery = useQuery({
    queryKey: ['stake_account', 'fetch', { cluster, account }],
    queryFn: () => program.account.stakeAccount.fetch(account),
  })

  const stake = useMutation<string, Error, StakeProps>({
    mutationKey: ['stake', 'stake', { cluster }],
    mutationFn: async({ amount, payer }) => {
      const pdaAccountPDA = await PublicKey.findProgramAddressSync(
        [Buffer.from("client1"), payer.toBuffer()],
        program.programId
      )[0];

      return program.methods
        .stake(
          new BN(amount)
        )
        .accounts({ 
          user: payer,
          pdaAccount: pdaAccountPDA
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }as any)
        .signers([])
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to stake'),
  })

  const unstake = useMutation<string, Error, UnstakeProps>({
    mutationKey: ['stake', 'unstake', { cluster }],
    mutationFn: async({ amount, payer }) => {
      const pdaAccountPDA = await PublicKey.findProgramAddressSync(
        [Buffer.from("client1"), payer.toBuffer()],
        program.programId
      )[0];

      return program.methods
        .unstake(
          new BN(amount)
        )
        .accounts({ 
          user: payer,
          pdaAccount: pdaAccountPDA
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }as any)
        .signers([])
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to unstake'),
  })

  const claim_points = useMutation<string, Error, ClaimPoints>({
    mutationKey: ['stake', 'claim', { cluster }],
    mutationFn: async({ payer, signTransaction }) => {
      // Generate new keypair for each test to ensure fresh state
      const rewardMint = new PublicKey("2TnAgxfwjBAQaywSXhPVnFmmFXqj6zQDmeAzdf17rV5b")
      console.log("Reward mint:", rewardMint.toBase58());

      // Derive mint authority PDA
      const [mintAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint_authority")],
        program.programId
      );
      console.log("Mint authority:", mintAuthority.toBase58());

      // FIXED: Use the same metadata account derivation as your Rust program
      // Your program uses find_metadata_account function which derives from Metaplex program
      const [metadataAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
          rewardMint.toBuffer(),
        ],
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
      );
      console.log("Metadata account:", metadataAccount.toBase58());

      const [userTokenAccountPDA] = PublicKey.findProgramAddressSync(
        [payer.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), rewardMint.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      console.log("user ata: ", userTokenAccountPDA.toBase58());

      const pdaAccountPDA = await PublicKey.findProgramAddressSync(
        [Buffer.from("client1"), payer.toBuffer()],
        program.programId
      )[0];

      // Check if ATA exists, if not create it
      const connection = program.provider.connection;
      const ataInfo = await connection.getAccountInfo(userTokenAccountPDA);

      if (!ataInfo) {
        console.log("Creating ATA for user...");
        // Create the ATA first
        const createAtaIx = createAssociatedTokenAccountInstruction(
          payer, // payer
          userTokenAccountPDA, // ata
          payer, // owner
          rewardMint // mint
        );
  
        // Build transaction with ATA creation + claim points
        const transaction = new Transaction();
        transaction.add(createAtaIx);
        
        // Add your claim points instruction
        const claimIx = await program.methods
          .claimPoints()
          .accounts({ 
            user: payer,
            pdaAccount: pdaAccountPDA,
            rewardMint: rewardMint,
            mintAuthority: mintAuthority,
            userTokenAccount: userTokenAccountPDA,
            tokenProgram: TOKEN_PROGRAM_ID 
          } as any)
          .instruction();
        
          const { blockhash } = await connection.getLatestBlockhash();
        transaction.add(claimIx);
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = payer
  
        // Send the combined transaction
        // const signature = await connection.sendRawTransaction(transaction.serialize());
        if (!signTransaction) {
          throw new Error('signTransaction function is required to sign the transaction.');
        }

        const signedTx = await signTransaction(transaction);
        const rawTx = signedTx.serialize();
        const signature = await connection.sendRawTransaction(rawTx);
        console.log("done");
        return signature;
      } else {
        console.log("ATA already exists, proceeding with claim...");
        // ATA exists, proceed normally
        return program.methods
          .claimPoints()
          .accounts({ 
            user: payer,
            pdaAccount: pdaAccountPDA,
            rewardMint: rewardMint,
            mintAuthority: mintAuthority,
            userTokenAccount: userTokenAccountPDA,
            tokenProgram: TOKEN_PROGRAM_ID 
          } as any)
          .rpc();
      }
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: (error) => {
      console.error("Claim points error:", error);
      toast.error('Failed to claim points.');
    },
  })

  const get_points = useMutation<string, Error, GetPoints>({
    mutationKey: ['stake', 'get', { cluster }],
    mutationFn: async({ payer }) => {
      const pdaAccountPDA = await PublicKey.findProgramAddressSync(
        [Buffer.from("client1"), payer.toBuffer()],
        program.programId
      )[0];

      return program.methods
        .getPoints()
        .accounts({ 
          user: payer,
          pdaAccount: pdaAccountPDA
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }as any)
        .signers([])
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to get points.'),
  })

  return {
    accountQuery,
    stake,
    unstake,
    claim_points,
    get_points
  }
}
