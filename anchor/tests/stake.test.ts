import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { Stake } from '../target/types/stake'
import { 
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SYSTEM_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/native/system';

describe('Stake test', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const wallet = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Stake as Program<Stake>

  // Test constants
  const EXPECTED_NAME = "Reward Token";
  const EXPECTED_SYMBOL = "REWARD";
  const EXPECTED_URI = "https://raw.githubusercontent.com/NeelContractor/staking-program-anchor/refs/heads/main/anchor/metadata.json";
  const EXPECTED_DECIMALS = 2;

  let pdaAccount: PublicKey;
  let rewardMint: Keypair;
  let mintAuthority: PublicKey;
  let metadataAccount: PublicKey;

  beforeAll(async () => {
    try {
      // Check if program is deployed and executable
      const programAccount = await provider.connection.getAccountInfo(program.programId);
      if (!programAccount) {
        throw new Error(`Program account not found at ${program.programId.toBase58()}. Make sure the program is deployed.`);
      }
      if (!programAccount.executable) {
        throw new Error(`Program account is not executable. Check your program deployment.`);
      }
      console.log("Program ID:", program.programId.toBase58());
      console.log("Program is executable:", programAccount.executable);

      // Request airdrop to ensure wallet has enough SOL
      const balance = await provider.connection.getBalance(wallet.publicKey);
      if (balance < LAMPORTS_PER_SOL) {
        console.log("Requesting airdrop...");
        const signature = await provider.connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL);
        await provider.connection.confirmTransaction(signature);
      }

      // Generate new keypair for each test to ensure fresh state
      rewardMint = Keypair.generate();
      console.log("Reward mint:", rewardMint.publicKey.toBase58());

      // Derive mint authority PDA
      [mintAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint_authority")],
        program.programId
      );
      console.log("Mint authority:", mintAuthority.toBase58());

      // FIXED: Use the same metadata account derivation as your Rust program
      // Your program uses find_metadata_account function which derives from Metaplex program
      [metadataAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
          rewardMint.publicKey.toBuffer(),
        ],
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
      );
      console.log("Metadata account:", metadataAccount.toBase58());

    } catch (error) {
      console.error("Setup error:", error);
      throw error;
    }
  });

  it('initialize reward mint', async () => {
    try {
      console.log("\n=== Account Details ===");
      console.log("Payer:", wallet.publicKey.toBase58());
      console.log("Reward mint:", rewardMint.publicKey.toBase58());
      console.log("Mint authority:", mintAuthority.toBase58());
      console.log("Metadata account:", metadataAccount.toBase58());
      console.log("Token metadata program:", MPL_TOKEN_METADATA_PROGRAM_ID);
      console.log("Program ID:", program.programId.toBase58());

      const tx = await program.methods
        .initializeRewardMint()
        .accounts({
          payer: wallet.publicKey,
          rewardMint: rewardMint.publicKey,
          mintAuthority: mintAuthority,
          metadata: metadataAccount,
          tokenMetadataProgram: new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SYSTEM_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY
        }as any)
        .signers([rewardMint]) // Only the reward mint keypair needs to sign
        .rpc({ skipPreflight: false }); // Enable preflight checks for better error messages

      console.log("Transaction signature:", tx);

      // Verify mint account was created correctly
      const mintAccount = await getMint(provider.connection, rewardMint.publicKey);
      console.log("\n=== Mint Account Details ===");
      console.log("Address:", mintAccount.address.toBase58());
      console.log("Decimals:", mintAccount.decimals);
      console.log("Supply:", mintAccount.supply.toString());
      console.log("Mint authority:", mintAccount.mintAuthority?.toBase58());
      console.log("Freeze authority:", mintAccount.freezeAuthority?.toBase58());

      // Verify the mint was created with correct parameters
      expect(mintAccount.decimals).toBe(EXPECTED_DECIMALS);
      expect(mintAccount.mintAuthority?.toBase58()).toBe(mintAuthority.toBase58());

    } catch (error) {
      console.error("Test error:", error);
      
      // Additional debugging information
      // if (error.message && error.message.includes("AccountNotExecutable")) {
      //   console.error("\n=== Debugging AccountNotExecutable Error ===");
      //   console.error("This usually means:");
      //   console.error("1. The program is not deployed");
      //   console.error("2. Wrong program ID");
      //   console.error("3. Wrong cluster (localnet/devnet/mainnet)");
      //   console.error("4. Program account is not executable");
        
      //   // Check each program account
      //   const programAccount = await provider.connection.getAccountInfo(program.programId);
      //   console.error("Program account exists:", !!programAccount);
      //   console.error("Program account executable:", programAccount?.executable);
        
      //   const metaplexAccount = await provider.connection.getAccountInfo(new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID));
      //   console.error("Metaplex program exists:", !!metaplexAccount);
      //   console.error("Metaplex program executable:", metaplexAccount?.executable);
      // }
      
      throw error;
    }
  });

  // Alternative test method if the above doesn't work
  it.skip('initialize reward mint (alternative method)', async () => {
    try {
      // Alternative approach: Let Anchor handle the metadata account derivation
      const tx = await program.methods
        .initializeRewardMint()
        .accountsStrict({
          payer: wallet.publicKey,
          rewardMint: rewardMint.publicKey,
          mintAuthority: mintAuthority,
          metadata: metadataAccount,
          tokenMetadataProgram: new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID),
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SYSTEM_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY
        })
        .signers([rewardMint])
        .rpc();

      console.log("Transaction signature:", tx);
      
    } catch (error) {
      console.error("Alternative test error:", error);
      throw error;
    }
  });

  // Debug helper test
  it.skip('debug program and accounts', async () => {
    console.log("\n=== Debug Information ===");
    
    // Check program account
    const programAccount = await provider.connection.getAccountInfo(program.programId);
    console.log("Program account:", {
      exists: !!programAccount,
      executable: programAccount?.executable,
      owner: programAccount?.owner.toBase58(),
      lamports: programAccount?.lamports
    });

    // Check Metaplex program
    const metaplexAccount = await provider.connection.getAccountInfo(new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID));
    console.log("Metaplex program:", {
      exists: !!metaplexAccount,
      executable: metaplexAccount?.executable,
      owner: metaplexAccount?.owner.toBase58()
    });

    // Check wallet balance
    const balance = await provider.connection.getBalance(wallet.publicKey);
    console.log("Wallet balance:", balance / LAMPORTS_PER_SOL, "SOL");

    // Check cluster
    console.log("RPC endpoint:", provider.connection.rpcEndpoint);
  });
});

// Helper function to match your Rust program's find_metadata_account function
function findMetadataAccount(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
      mint.toBuffer(),
    ],
    new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
  );
}

// import * as anchor from '@coral-xyz/anchor'
// import { Program } from '@coral-xyz/anchor'
// import { Keypair, LAMPORTS_PER_SOL, PublicKey, SYSVAR_RENT_PUBKEY, SYSVAR_REWARDS_PUBKEY } from '@solana/web3.js'
// import { Stake } from '../target/types/stake'
// import { 
//   MPL_TOKEN_METADATA_PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
//   Metadata,
//   MPL_TOKEN_METADATA_PROGRAM_ID
// } from "@metaplex-foundation/mpl-token-metadata";
// import { getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
// import { SYSTEM_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/native/system';

// describe('Stake test', () => {
//   // Configure the client to use the local cluster.
//   const provider = anchor.AnchorProvider.env()
//   anchor.setProvider(provider)
//   const wallet = provider.wallet as anchor.Wallet

//   const program = anchor.workspace.Stake as Program<Stake>

//   // Test constants
//   const EXPECTED_NAME = "Reward Token";
//   const EXPECTED_SYMBOL = "REWARD";
//   const EXPECTED_URI = "https://raw.githubusercontent.com/NeelContractor/staking-program-anchor/refs/heads/main/anchor/metadata.json";
//   const EXPECTED_DECIMALS = 2;

//   let pdaAccount: PublicKey;
//   let rewardMint: Keypair;
//   let mintAuthority: PublicKey;
//   let metadata: PublicKey;
//   let metadataAccount: PublicKey;


//   beforeAll(async () => {
//     // Request airdrop to ensure wallet has enough SOL
//     // const signature = await provider.connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL);
//     // await provider.connection.confirmTransaction(signature);
    
//     // [pdaAccount] = PublicKey.findProgramAddressSync(
//     //   [Buffer.from("client1"), wallet.publicKey.toBuffer()],
//     //   program.programId
//     // );

//     // Generate new keypair for each test to ensure fresh state
//     rewardMint = Keypair.generate();
//     console.log("reward: ", rewardMint.publicKey);

//     // Derive mint authority PDA
//     [mintAuthority] = PublicKey.findProgramAddressSync(
//       [Buffer.from("mint_authority")],
//       program.programId
//     );
//     console.log("mintAuthority: ", mintAuthority.toBase58());

//     // Derive metadata PDA
//     [metadata] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("metadata"),
//         new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
//         rewardMint.publicKey.toBuffer(),
//       ],
//       program.programId
//     );

//     function findMetadataAccount(mint: PublicKey): [PublicKey, number] {
//       return PublicKey.findProgramAddressSync(
//         [
//           Buffer.from("metadata"),
//           new PublicKey(TOKEN_METADATA_PROGRAM_ID).toBuffer(),
//           mint.toBuffer(),
//         ],
//         new PublicKey(TOKEN_METADATA_PROGRAM_ID)
//         // program.programId
//       );
//     }

//     [metadataAccount] = findMetadataAccount(rewardMint.publicKey);
//     console.log("metadataAccount: ", metadataAccount.toBase58());
//     console.log("metadata: ", metadata.toBase58());
//   })

//   it('intialize reward mint', async () => {
//     const tx = await program.methods
//       .initializeRewardMint()
//       .accounts({
//         payer: wallet.publicKey,
//         rewardMint: rewardMint.publicKey,
//         mintAuthority: mintAuthority,
//         metadata: metadataAccount,
//         tokenMetadataProgram: new PublicKey(TOKEN_METADATA_PROGRAM_ID),
//         tokenProgram: TOKEN_PROGRAM_ID,
//         systemProgram: SYSTEM_PROGRAM_ID,
//         rent: SYSVAR_RENT_PUBKEY
//       } as any)
//       .signers([rewardMint, wallet.payer])
//       .rpc({ skipPreflight: true })
      
//       console.log("Transaction signature:", tx);

//       // Verify mint account was created correctly
//       const mintAccount = await getMint(provider.connection, rewardMint.publicKey);
//       console.log(mintAccount)
//   })

//   // it('Initialize Stake Account', async () => {
//   //   try {
//   //     await program.methods
//   //       .createPdaAccount()
//   //       .accounts({
//   //         payer: wallet.publicKey,
//   //         pdaAccount: pdaAccount,
//   //         systemProgram: anchor.web3.SystemProgram.programId,
//   //       } as any)
//   //       .signers([wallet.payer])
//   //       .rpc()

//   //     const account = await program.account.stakeAccount.fetch(pdaAccount);
//   //     console.log("PDA Data after initialization:", account);
//   //   } catch (error) {
//   //     console.error("Error initializing stake account:", error);
//   //     throw error;
//   //   }
//   // })

//   // it('stake', async () => {
//   //   try {
//   //     const stakeAmount = new anchor.BN(Math.floor(1 * LAMPORTS_PER_SOL));
//   //     console.log("Staking amount:", stakeAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");

//   //     await program.methods
//   //       .stake(stakeAmount)
//   //       .accounts({ 
//   //         user: wallet.publicKey,
//   //         pdaAccount: pdaAccount,
//   //         systemProgram: anchor.web3.SystemProgram.programId,
//   //       } as any)
//   //       .signers([wallet.payer])
//   //       .rpc()

//   //     const account = await program.account.stakeAccount.fetch(pdaAccount);
//   //     console.log("PDA Data after stake:", account);
//   //     console.log("Staked amount:", account.stakedAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");
//   //   } catch (error) {
//   //     console.error("Error staking:", error);
//   //     throw error;
//   //   }
//   // })

//   // it('claim points', async () => {
//   //   // console.log("Waiting 1 minute before claim points...");
//   //   // await new Promise(resolve => setTimeout(resolve, 60_000)); // Wait 60 seconds

//   //   await program.methods.claimPoints()
//   //     .accounts({ 
//   //       user: wallet.publicKey,
//   //       pdaAccount: pdaAccount
//   //     } as any)
//   //     .signers([wallet.payer])
//   //     .rpc()

//   //     const account = await program.account.stakeAccount.fetch(pdaAccount);
//   //     console.log("PDA Data after claim points:", account);
//   // })

//   // it('get points', async () => {
//   //   const account = await program.account.stakeAccount.fetch(pdaAccount);
//   //   console.log("PDA Data before get points:", account);

//   //   await program.methods.getPoints()
//   //     .accounts({ 
//   //       user: wallet.publicKey,
//   //       pdaAccount: pdaAccount
//   //     } as any)
//   //     .signers([wallet.payer])
//   //     .rpc();

//   //     console.log("PDA Data after get points:", account);
//   // })

//   // it('unstake', async () => {
//   //   try {
//   //     const account = await program.account.stakeAccount.fetch(pdaAccount);
//   //     console.log("Current staked amount:", account.stakedAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");

//   //     const unstakeAmount = new anchor.BN(Math.floor(1 * LAMPORTS_PER_SOL));
//   //     console.log("Unstaking amount:", unstakeAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");
      
//   //     await program.methods
//   //       .unstake(unstakeAmount)
//   //       .accounts({ 
//   //         user: wallet.publicKey,
//   //         pdaAccount: pdaAccount,
//   //         systemProgram: anchor.web3.SystemProgram.programId,
//   //       } as any)
//   //       .signers([wallet.payer])
//   //       .rpc()

//   //     const updatedAccount = await program.account.stakeAccount.fetch(pdaAccount);
//   //     console.log("PDA Data after unstake:", updatedAccount);
//   //     console.log("Remaining staked amount:", updatedAccount.stakedAmount.toNumber() / LAMPORTS_PER_SOL, "SOL");
//   //   } catch (error) {
//   //     console.error("Error unstaking:", error);
//   //     throw error;
//   //   }
//   // }, 10000)
// })
