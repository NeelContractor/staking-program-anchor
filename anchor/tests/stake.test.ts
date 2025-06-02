import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { Stake } from '../target/types/stake'

describe('Stake test', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const wallet = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Stake as Program<Stake>

  let pdaAccount: PublicKey;

  beforeAll(async () => {
    // Request airdrop to ensure wallet has enough SOL
    // const signature = await provider.connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL);
    // await provider.connection.confirmTransaction(signature);
    
    [pdaAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("client1"), wallet.publicKey.toBuffer()],
      program.programId
    );
  })

  // it('Initialize Stake Account', async () => {
  //   try {
  //     await program.methods
  //       .createPdaAccount()
  //       .accounts({
  //         payer: wallet.publicKey,
  //         pdaAccount: pdaAccount,
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //       } as any)
  //       .signers([wallet.payer])
  //       .rpc()

  //     const account = await program.account.stakeAccount.fetch(pdaAccount);
  //     console.log("PDA Data after initialization:", account);
  //   } catch (error) {
  //     console.error("Error initializing stake account:", error);
  //     throw error;
  //   }
  // })

  // it('stake', async () => {
  //   try {
  //     const stakeAmount = new anchor.BN(Math.floor(1 * LAMPORTS_PER_SOL));
  //     console.log("Staking amount:", stakeAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");

  //     await program.methods
  //       .stake(stakeAmount)
  //       .accounts({ 
  //         user: wallet.publicKey,
  //         pdaAccount: pdaAccount,
  //         systemProgram: anchor.web3.SystemProgram.programId,
  //       } as any)
  //       .signers([wallet.payer])
  //       .rpc()

  //     const account = await program.account.stakeAccount.fetch(pdaAccount);
  //     console.log("PDA Data after stake:", account);
  //     console.log("Staked amount:", account.stakedAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");
  //   } catch (error) {
  //     console.error("Error staking:", error);
  //     throw error;
  //   }
  // })

  it('claim points', async () => {
    // console.log("Waiting 1 minute before claim points...");
    // await new Promise(resolve => setTimeout(resolve, 60_000)); // Wait 60 seconds

    await program.methods.claimPoints()
      .accounts({ 
        user: wallet.publicKey,
        pdaAccount: pdaAccount
      } as any)
      .signers([wallet.payer])
      .rpc()

      const account = await program.account.stakeAccount.fetch(pdaAccount);
      console.log("PDA Data after claim points:", account);
  })

  it('get points', async () => {
    const account = await program.account.stakeAccount.fetch(pdaAccount);
    console.log("PDA Data before get points:", account);

    await program.methods.getPoints()
      .accounts({ 
        user: wallet.publicKey,
        pdaAccount: pdaAccount
      } as any)
      .signers([wallet.payer])
      .rpc();

      console.log("PDA Data after get points:", account);
  })

  it('unstake', async () => {
    try {
      const account = await program.account.stakeAccount.fetch(pdaAccount);
      console.log("Current staked amount:", account.stakedAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");

      const unstakeAmount = new anchor.BN(Math.floor(1 * LAMPORTS_PER_SOL));
      console.log("Unstaking amount:", unstakeAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");
      
      await program.methods
        .unstake(unstakeAmount)
        .accounts({ 
          user: wallet.publicKey,
          pdaAccount: pdaAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .signers([wallet.payer])
        .rpc()

      const updatedAccount = await program.account.stakeAccount.fetch(pdaAccount);
      console.log("PDA Data after unstake:", updatedAccount);
      console.log("Remaining staked amount:", updatedAccount.stakedAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");
    } catch (error) {
      console.error("Error unstaking:", error);
      throw error;
    }
  }, 10000)
})
