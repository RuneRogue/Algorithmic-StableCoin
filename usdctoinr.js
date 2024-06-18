const { ethers } = require('ethers')
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { abi: SwapRouterABI} = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')
const { getPoolImmutables, getPoolState } = require('./helpers')
const ERC20ABI = require('./abi.json')

require('dotenv').config()
const INFURA_URL_TESTNET = process.env.INFURA_URL_TESTNET
const WALLET_ADDRESS = process.env.WALLET_ADDRESS
const WALLET_SECRET = process.env.WALLET_SECRET

const provider = new ethers.JsonRpcProvider('https://polygon-mainnet.g.alchemy.com/v2/V5T55x5KhnbDBlRE-Ni6Aeyoh34AYIl5');
const poolAddress = "0x2145359f475f30FE7c03ADf2f32586EB4c806cBe" // UNI/WETH
const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'

const name0 = 'INR Coin'
const symbol0 = 'INRC'
const decimals0 = 18
const address0 = '0x87e32F78a22DeE1BBBE316d5CdAf68fe1D842749'

const name1 = 'USD Coin'
const symbol1 = 'USDC'
const decimals1 = 6
const address1 = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'


async function usdctoinrc(amountsss) {
  const poolContract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    provider
  )

  const immutables = await getPoolImmutables(poolContract)
  const state = await getPoolState(poolContract)

  const wallet = new ethers.Wallet(WALLET_SECRET)
  const connectedWallet = wallet.connect(provider)

  const swapRouterContract = new ethers.Contract(
    swapRouterAddress,
    SwapRouterABI,
    provider
  )

  const inputAmount = amountsss;
  // .001 => 1 000 000 000 000 000
  const amountIn = (inputAmount * 1000000);
  console.log(amountIn)

  const approvalAmount = (amountIn).toString()
  const tokenContract0 = new ethers.Contract(
    address1,
    ERC20ABI,
    provider
  )
  const approvalResponse = await tokenContract0.connect(connectedWallet).approve(
    swapRouterAddress,
    approvalAmount
  )

  const params = {
    tokenIn: immutables.token0,
    tokenOut: immutables.token1,
    fee: immutables.fee,
    recipient: WALLET_ADDRESS,
    deadline: Math.floor(Date.now() / 1000) + (60 * 10),
    amountIn: amountIn,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  }

  try {
    const transaction = await swapRouterContract.connect(connectedWallet).exactInputSingle(
      params,
      {
        gasLimit: 1000000
      }
    )


    const receipt = await transaction.wait()
    console.log('Transaction Receipt:', receipt)

    

    
  } catch (error) {
    console.error('Error during swap:', error)
  }

}

module.exports = usdctoinrc;