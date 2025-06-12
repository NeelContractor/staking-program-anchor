#![allow(clippy::result_large_err)]
#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_lang::system_program::{
    Transfer, transfer,
};
use anchor_spl::{
    metadata::{create_metadata_accounts_v3, CreateMetadataAccountsV3},
    token::{Mint, Token, TokenAccount, mint_to, MintTo}
};
use mpl_token_metadata::ID as TOKEN_METADATA_ID;
use mpl_token_metadata::types::{DataV2, Creator};

#[constant]
pub const NAME: &str = "Reward Token";

#[constant]
pub const SYMBOL: &str = "REWARD";

#[constant]
pub const URI: &str = "https://raw.githubusercontent.com/NeelContractor/Solana-Bootcamp-Projects/refs/heads/main/token-lottery/anchor/metadata.json";

declare_id!("9dAhsicM6p9GFKcGoTJyzE2G3Lznc5agHgWpuxoPQpFC");

const POINTS_PER_SOL_PER_DAY: u64 = 1_000_000;
const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
const SECONDS_PER_DAY: u64 = 86_400;

#[program]
pub mod stake {

    use super::*;

    pub fn create_pda_account(ctx: Context<CreatePdaAccount>) -> Result<()> {
        let pda_account = &mut ctx.accounts.pda_account;
        let clock = Clock::get()?;

        pda_account.owner = ctx.accounts.payer.key();
        pda_account.staked_amount = 0;
        pda_account.total_points = 0;
        pda_account.last_update_time = clock.unix_timestamp;
        pda_account.bump = ctx.bumps.pda_account;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakeError::InvalidAmount);

        let pda_account = &mut ctx.accounts.pda_account;
        let clock = Clock::get()?;

        update_points(pda_account, clock.unix_timestamp)?;

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: pda_account.to_account_info()
            }
        );

        transfer(cpi_context, amount)?;

        pda_account.staked_amount = pda_account.staked_amount.checked_add(amount)
            .ok_or(StakeError::Overflow)?;

        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        require!(amount > 0, StakeError::InvalidAmount);

        let pda_account = &mut ctx.accounts.pda_account;
        let clock = Clock::get()?;

        require!(pda_account.staked_amount >= amount, StakeError::InsufficientStake);

        update_points(pda_account, clock.unix_timestamp)?;

        msg!("Before: PDA: {}, User: {}", 
            **pda_account.to_account_info().lamports.borrow(),
            **ctx.accounts.user.to_account_info().lamports.borrow());

        **pda_account.to_account_info().lamports.borrow_mut() -= amount;
        **ctx.accounts.user.to_account_info().lamports.borrow_mut() += amount;

        msg!("After: PDA: {}, User: {}", 
            **pda_account.to_account_info().lamports.borrow(),
            **ctx.accounts.user.to_account_info().lamports.borrow());

        pda_account.staked_amount = pda_account.staked_amount.checked_sub(amount)
            .ok_or(StakeError::Underflow)?;

        Ok(())
    }

    pub fn claim_points(ctx: Context<ClaimPoints>) -> Result<()> {
        let pda_account = &mut ctx.accounts.pda_account;
        let clock = Clock::get()?;

        update_points(pda_account, clock.unix_timestamp)?;

        let claimable_points = pda_account.total_points / 1_000_000;
        msg!("user has {} claimable points", claimable_points);

        let mint_authority_bump = ctx.bumps.mint_authority;
        let seeds: &[&[u8]] = &[
            b"mint_authority",
            &[mint_authority_bump]
        ];
        let signer_seeds = &[seeds];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(), 
            MintTo {
                mint: ctx.accounts.reward_mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info()
            }, 
            signer_seeds
        );
        mint_to(cpi_ctx, claimable_points)?;

        pda_account.total_points = 0;
        Ok(())
    }

    pub fn get_points(ctx: Context<GetPoints>) -> Result<()> {
        let pda_account = &mut ctx.accounts.pda_account;
        let clock = Clock::get()?;

        let time_elapsed = clock.unix_timestamp.checked_sub(pda_account.last_update_time)
            .ok_or(StakeError::InvalidTimestamp)? as u64;

        let new_points = calculate_points_earned(pda_account.staked_amount, time_elapsed)?;
        let current_total_points = pda_account.total_points.checked_add(new_points)
            .ok_or(StakeError::Overflow)? as u64;

        msg!("Current points: {}, Staked amount: {} SOL", 
             current_total_points / 1_000_000, 
             pda_account.staked_amount / LAMPORTS_PER_SOL);
            
        Ok(())
    }

    pub fn initialize_reward_mint(ctx: Context<InitializeRewardMint>) -> Result<()> {
        let creators = vec![
            Creator {
                address: ctx.accounts.payer.key().clone(),
                verified: false,
                share: 100,
            },
        ];

        let data_v2 = DataV2 {
            name: NAME.to_string(),
            symbol: SYMBOL.to_string(),
            uri: URI.to_string(),
            seller_fee_basis_points: 0,
            creators: Some(creators),
            collection: None,
            uses: None
        };

        let mint_authority_bump = ctx.bumps.mint_authority;
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"mint_authority",
            &[mint_authority_bump]
        ]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(), 
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata.to_account_info(),
                mint: ctx.accounts.reward_mint.to_account_info(),
                mint_authority: ctx.accounts.mint_authority.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.mint_authority.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            }, &signer_seeds
        );

        create_metadata_accounts_v3(cpi_ctx, data_v2, true, true, None)?;
        Ok(())
    }

}

#[derive(Accounts)]
pub struct InitializeRewardMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 2,
        mint::authority = mint_authority
    )]
    pub reward_mint: Account<'info, Mint>,

    /// CHECK: This is the mint authority PDA
    #[account(
        seeds = [b"mint_authority"],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,

    /// CHECK: This account will be initialized by the metaplex program
    #[account(
        mut, 
        seeds = [
            b"metadata",
            TOKEN_METADATA_ID.as_ref(),
            reward_mint.key().as_ref()
        ],
        bump,
        seeds::program = TOKEN_METADATA_ID
    )]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: This is the token metadata program
    #[account(address = TOKEN_METADATA_ID)]
    pub token_metadata_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreatePdaAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"client1", payer.key().as_ref()],
        bump
    )]
    pub pda_account: Account<'info, StakeAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"client1", user.key().as_ref()],
        bump = pda_account.bump,
        constraint = pda_account.owner == user.key() @ StakeError::Unauthorized
    )]
    pub pda_account: Account<'info, StakeAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"client1", user.key().as_ref()],
        bump = pda_account.bump,
        constraint = pda_account.owner == user.key() @ StakeError::Unauthorized
    )]
    pub pda_account: Account<'info, StakeAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)] 
pub struct ClaimPoints<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"client1", user.key().as_ref()],
        bump = pda_account.bump,
        constraint = pda_account.owner == user.key() @ StakeError::Unauthorized
    )]
    pub pda_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        constraint = reward_mint.mint_authority == COption::Some(mint_authority.key()) @ StakeError::InvalidMintAuthority
    )]
    pub reward_mint: Account<'info, Mint>,

    /// CHECK: This is the mint authority PDA
    #[account(
        seeds = [b"mint_authority"],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key() @ StakeError::Unauthorized,
        constraint = user_token_account.mint == reward_mint.key() @ StakeError::InvalidTokenAccount
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)] 
pub struct GetPoints<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"client1", user.key().as_ref()],
        bump = pda_account.bump,
        constraint = pda_account.owner == user.key() @ StakeError::Unauthorized
    )]
    pub pda_account: Account<'info, StakeAccount>,
}

fn update_points(pda_account: &mut StakeAccount, current_time: i64) -> Result<()> {
    let time_elapsed = current_time.checked_sub(pda_account.last_update_time)
        .ok_or(StakeError::InvalidTimestamp)? as u64;

    if time_elapsed > 0 && pda_account.staked_amount > 0 {
        let new_points = calculate_points_earned(pda_account.staked_amount, time_elapsed)?;
        pda_account.total_points = pda_account.total_points.checked_add(new_points)
            .ok_or(StakeError::Overflow)?;
    }

    pda_account.last_update_time = current_time;
    Ok(())
}

fn calculate_points_earned(staked_amount: u64, time_elapsed_seconds: u64) -> Result<u64> {
    let points = (staked_amount as u128)
        .checked_mul(time_elapsed_seconds as u128)
        .ok_or(StakeError::Overflow)?
        .checked_mul(POINTS_PER_SOL_PER_DAY as u128)
        .ok_or(StakeError::Overflow)?
        .checked_div(LAMPORTS_PER_SOL as u128)
        .ok_or(StakeError::Overflow)?
        .checked_div(SECONDS_PER_DAY as u128)
        .ok_or(StakeError::Overflow)?;

    Ok(points as u64)
}

#[account]
#[derive(InitSpace)]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub staked_amount: u64,
    pub total_points: u64,
    pub last_update_time: i64,
    pub bump: u8,
}


#[error_code]
pub enum StakeError {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid Time")]
    InvalidTimestamp,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Arithmetic underflow")]
    Underflow,
    #[msg("Amount should be greater than 0")]
    InvalidAmount,
    #[msg("Insufficient stake amount")]
    InsufficientStake,
    #[msg("Invalid mint authority")]
    InvalidMintAuthority,
    #[msg("Token Account is Invalid")]
    InvalidTokenAccount,
}