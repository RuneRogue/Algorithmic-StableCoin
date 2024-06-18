const express = require('express');
const app = express();
const { ethers } = require('ethers');
const math = require('math');
const JSBI = require('jsbi');
const { TickMath, FullMath } = require('@uniswap/v3-sdk');
const { SwapRouter, Percent, Token, TradeType, Route, Pool, Trade, CurrencyAmount } = require('@uniswap/v3-sdk');
const { Token: CoreToken, CurrencyAmount: CoreCurrencyAmount } = require('@uniswap/sdk-core');
const { encodeRouteToPath } = require('@uniswap/v3-sdk');
const inrctousdc = require('./uniswapTrader');
const usdctoinrc = require('./usdctoinr');
const inrcabi = require ('./INRCabi.json');
const port = 3000;
// Replace with your actual contract ABI and address
const contractAbi =  [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "burnTokens",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "mintTokens",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_pool",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_token",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_positionManager",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "initialOwner",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint8",
				"name": "bits",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "SafeCastOverflowedUintDowncast",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "tokenAddress",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "withdrawTokens",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getCurrentINRCPrice",
		"outputs": [
			{
				"internalType": "int24",
				"name": "",
				"type": "int24"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getINRCBalanceInPool",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getUSDCBalanceInPool",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "pool",
		"outputs": [
			{
				"internalType": "contract IUniswapV3Pool",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "positionManager",
		"outputs": [
			{
				"internalType": "contract INonfungiblePositionManager",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "token",
		"outputs": [
			{
				"internalType": "contract IERC20",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]; // Your contract ABI

const oracleABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "getLatestPrice",
		"outputs": [
			{
				"internalType": "int256",
				"name": "",
				"type": "int256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const oracleAddress = "0x572BEB57EAB1aD11cBE4C79f5Fd0C8569Ab73086";

const contractAddress = "0xA3C8FfEC8130341178dcc3Fd501099451b62fFB4"; // Your contract address

// Replace with your Ethereum node URL
const provider = new ethers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/V5T55x5KhnbDBlRE-Ni6Aeyoh34AYIl5');

// Replace with your private key or use other wallet providers
const privateKey = '127676b648f696051c0d4d77cdcb1a0bace3fb9fbbcd5e46e42076e64d1b0f12'; // Your private key
const wallet = new ethers.Wallet(privateKey, provider);

// Replace with your contract instance
const contract = new ethers.Contract(contractAddress, contractAbi, wallet);
const oracleContract = new ethers.Contract(oracleAddress, oracleABI, wallet);

const INRC = new CoreToken(1, '0x87e32F78a22DeE1BBBE316d5CdAf68fe1D842749', 18, 'INRC', 'Indian Rupee Coin'); // Replace with actual INRC token address
const USDC = new CoreToken(1, '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', 6, 'USDC', 'USD Coin'); // Replace with actual USDC token address

const poolAddress = '0x2145359f475f30FE7c03ADf2f32586EB4c806cBe';

const inrccontract = new ethers.Contract('0x87e32F78a22DeE1BBBE316d5CdAf68fe1D842749', inrcabi, wallet);


async function priceCalculator() {
	const ticker = await currentTick();
	const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(ticker)
	console.log(sqrtRatioX96.toString());
	const ratioX192 = JSBI.multiply(sqrtRatioX96, sqrtRatioX96)
  
	const baseAmount = JSBI.BigInt( 1 * (10 ** 6))
  
	const shift = JSBI.leftShift( JSBI.BigInt(1), JSBI.BigInt(192))
  
	const quoteAmount = FullMath.mulDivRoundingUp(ratioX192 ,baseAmount , shift)
	const ans = (10**18) / quoteAmount.toString();
	return ans;
  }


  async function currentDeposite() {
    const CD = await contract.getUSDCBalanceInPool();
    const finall = Number(CD) / (10 ** 6);
    return finall;
}

async function currentCoins() {
    const CC = await contract.getINRCBalanceInPool();
    const finalll = Number(CC) / (10**18);
    return finalll; // Convert BigInt to Number if needed
}

async function oracle() {
    const pc = await oracleContract.getLatestPrice();
    const pcNumber = Number(pc);
    
    // Scale the result up by 10^8 to avoid precision loss
    const result = pcNumber / (10 ** 8);
    
    return result;
}


async function currentTick() {
    try {
        const result = await contract.getCurrentINRCPrice();
        // Convert result to a number (remove trailing 'n')
        const tickNumber = parseInt(result);
        return tickNumber;
    } catch (error) {
        console.error('Error fetching current tick:', error);
        throw error;
    }
	}

	 async function supplyAdjustment() {
		try {
		   const price = await priceCalculator();
		   console.log("Price:", price);
	 
		   const oracleV = await oracle();
		   console.log("Oracle:", oracleV);
	 
		   const currentD = await currentDeposite();
		   console.log("Current Deposit:", currentD);
	 
		   const currentC = await currentCoins();
		   console.log("Current Coins:", currentC);
	 
		   if (price < (oracleV - (oracleV*(0.0005)))) {
			  let burnAmount = ((oracleV * currentC) - currentD) / (oracleV + price);
			  burnusdc = burnAmount*price;
			  burnusdc = parseFloat(burnusdc.toFixed(5));
			  console.log("Burn Amount:", burnusdc);
			  await usdctoinrc(burnusdc);
			  const amounttoburn = burnAmount - (burnAmount*0.01);
			  const burning = ethers.parseEther(amounttoburn.toString())
			  const tx = await inrccontract.burn(burning.toString());
    		  await tx.wait();
    		  console.log('Burned:', amounttoburn);
			  		
		   } else if (price > (oracleV + (oracleV*(0.0005)))) {
			  let mintAmount = ( currentD - (oracleV * currentC) ) / (oracleV + price);
			  console.log("Mint Amount:", mintAmount);
			  await inrctousdc(mintAmount);
		   }
	 
		   console.log("Supply adjustment completed");
		} catch (error) {
		   console.error("Error in supply adjustment:", error);
		}
	 }


	 async function executeSupplyAdjustment() {
		await supplyAdjustment();
		setTimeout(executeSupplyAdjustment, 2 * 60 * 1000); // Wait for 2 minutes before executing again
	}
	
	// Start the execution loop
	executeSupplyAdjustment().catch(console.error);

  app.listen(port, () => {
	  console.log(`Server running on port ${port}`);
  });