'use client'

import { getStakeProgram, getStakeProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import { BN } from 'bn.js'

interface CreatePdaAccountProps {
  payer: PublicKey,
}
interface ClaimPoints {
  payer: PublicKey,
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
    mutationFn: async({ payer }) => {
      const pdaAccountPDA = await PublicKey.findProgramAddressSync(
        [Buffer.from("client1"), payer.toBuffer()],
        program.programId
      )[0];

      return program.methods
        .claimPoints()
        .accounts({ 
          user: payer,
          pdaAccount: pdaAccountPDA
        }as any)
        .signers([])
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to claim points.'),
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
