// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

contract SupplyAdjustment is Ownable {
    using SafeMath for uint256;
    using SafeCast for uint256;

    address constant USDC = 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359;
    address constant INRC = 0x87e32F78a22DeE1BBBE316d5CdAf68fe1D842749;

    IUniswapV3Pool public pool;
    IERC20 public token;
    ISwapRouter public swapRouter;

    constructor(
        address _pool,
        address _token,
        address initialOwner,
        address _swapRouter
    ) Ownable(initialOwner) {
        pool = IUniswapV3Pool(_pool);
        token = IERC20(_token);
        swapRouter = ISwapRouter(_swapRouter);
    }

    function getUSDCBalanceInPool() external view returns (uint256) {
        IERC20 usdcToken = IERC20(pool.token0());
        return usdcToken.balanceOf(address(pool));
    }

    function getINRCBalanceInPool() external view returns (uint256) {
        IERC20 inrcToken = IERC20(pool.token1());
        return inrcToken.balanceOf(address(pool));
    }

    function getCurrentINRCPrice() external view returns (int24) {
        (, int24 currentTick, , , , , ) = pool.slot0();
        return currentTick;
    }

    function mintTokens(uint256 amount) public {
        // Check allowance and balance
        require(IERC20(INRC).allowance(msg.sender, address(this)) >= amount, "Insufficient allowance for INRC");
        require(IERC20(INRC).balanceOf(msg.sender) >= amount, "Insufficient balance for INRC");

        // Transfer INRC tokens from the sender to the contract
        // TransferHelper.safeTransferFrom(INRC, msg.sender, address(this), amount);

        // // Approve the swap router to spend INRC tokens
        // TransferHelper.safeApprove(INRC, address(swapRouter), amount);

        // Swap INRC to USDC
        uint256 usdcReceived = swapTokens(INRC, USDC, amount);

        // Additional logic after receiving USDC (if needed)
    }

    function burnTokens(uint256 amount) public {
        // Check allowance and balance
        require(IERC20(USDC).allowance(msg.sender, address(this)) >= amount, "Insufficient allowance for USDC");
        require(IERC20(USDC).balanceOf(msg.sender) >= amount, "Insufficient balance for USDC");

        // Transfer USDC tokens from the sender to the contract
        // TransferHelper.safeTransferFrom(USDC, msg.sender, address(this), amount);

        // // Approve the swap router to spend USDC tokens
        // TransferHelper.safeApprove(USDC, address(swapRouter), amount);

        // Swap USDC to INRC
        uint256 inrcReceived = swapTokens(USDC, INRC, amount);

        // Additional logic after receiving INRC (if needed)
    }

    function swapTokens(address tokenIn, address tokenOut, uint256 amountIn) internal returns (uint256) {
        // Perform the token swap using Uniswap V3
        uint256 amountOut = swapRouter.exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: 3000, // Adjust the fee tier as needed
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            })
        );
        return amountOut;
    }

    // Owner can withdraw any mistakenly sent tokens
    function withdrawTokens(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20(tokenAddress).transfer(msg.sender, amount);
    }
}
