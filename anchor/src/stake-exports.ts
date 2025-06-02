// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import StakeIDL from '../target/idl/stake.json'
import type { Stake } from '../target/types/stake'

// Re-export the generated IDL and type
export { Stake, StakeIDL }

// The programId is imported from the program IDL.
export const STAKE_PROGRAM_ID = new PublicKey(StakeIDL.address)

// This is a helper function to get the Counter Anchor program.
export function getStakeProgram(provider: AnchorProvider, address?: PublicKey): Program<Stake> {
  return new Program({ ...StakeIDL, address: address ? address.toBase58() : StakeIDL.address } as Stake, provider)
}

// This is a helper function to get the program ID for the Counter program depending on the cluster.
export function getStakeProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Counter program on devnet and testnet.
      return new PublicKey('9dAhsicM6p9GFKcGoTJyzE2G3Lznc5agHgWpuxoPQpFC')
    case 'mainnet-beta':
    default:
      return STAKE_PROGRAM_ID
  }
}
