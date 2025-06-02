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
    // await provider.connection.requestAirdrop(wallet.publicKey, 1 * LAMPORTS_PER_SOL);
    
    [pdaAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("client1"), wallet.publicKey.toBuffer()],
      program.programId
    );
  })

  it('Initialize Stake', async () => {
    await program.methods
      .createPdaAccount()
      .accounts({
        payer: wallet.publicKey,
        pdaAccount: pdaAccount,
      } as any)
      .signers([wallet.payer])
      .rpc()

    const account = await program.account.stakeAccount.fetch(pdaAccount);
    console.log("PDA Data:", account);
  })

  it('stake', async () => {
    await program.methods
      .stake(
        new anchor.BN(1 * LAMPORTS_PER_SOL)
      )
      .accounts({ 
        user: wallet.publicKey,
        pdaAccount: pdaAccount 
      } as any)
      .signers([wallet.payer])
      .rpc()

      const account = await program.account.stakeAccount.fetch(pdaAccount);
    console.log("PDA Data after stake:", account);
  })

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
    console.log("PDA Data after get points:", account);

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
    // console.log("pdaAccount: ", pdaAccount.toBase58());
    const account = await program.account.stakeAccount.fetch(pdaAccount);
    // console.log(account.stakeAmount.toNumber());
    console.log(account.stakedAmount);
    console.log(account.stakedAmount.toNumber());
    
    const ix = await program.methods
      .unstake(
        new anchor.BN(0.5 * LAMPORTS_PER_SOL)
      )
      .accounts({ 
        user: wallet.publicKey,
        pdaAccount: pdaAccount
      } as any)
      .signers([wallet.payer])
      .instruction();

      const blockHash = await provider.connection.getLatestBlockhash();
      const transaction = new anchor.web3.Transaction().add(ix);
      transaction.recentBlockhash = blockHash.blockhash;
      transaction.feePayer = wallet.publicKey;
      transaction.sign(wallet.payer);
      const sign = await provider.sendAndConfirm(transaction, [wallet.payer]);
      console.log("sign :", sign);

      // const tx = new anchor.web3.Transaction({
      //   feePayer: wallet.payer.publicKey,
      //   blockhash: blockHash.blockhash,
      //   lastValidBlockHeight: blockHash.lastValidBlockHeight
      // }).add(ix);

      // const signature = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [wallet.payer]);
      // console.log("Unstake Signature :", signature);

      console.log("PDA Data after unstake:", account);
  }, 5000)

})
