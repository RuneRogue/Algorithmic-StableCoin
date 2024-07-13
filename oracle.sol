// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract PriceConsumerV3 {
    AggregatorV3Interface internal priceFeed;

    /**
     * Network: Kovan
     * Aggregator: INR/USD
     * Address: (Get the latest address from Chainlink documentation)
     */
    constructor() {
        priceFeed = AggregatorV3Interface(0xDA0F8Df6F5dB15b346f4B8D1156722027E194E60);
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice() public view returns (int) {
        ( , int price , , , ) = priceFeed.latestRoundData();
        return price;
    }
}
