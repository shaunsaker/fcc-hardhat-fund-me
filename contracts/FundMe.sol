// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FundMe__NotOwner();

/** @title A contract for crowd funding
 * @author Shaun Saker
 * @notice This contract is to demo a sample funding contract
 * @dev This implements price feeds as our library */
contract FundMe {
    using PriceConverter for uint256;

    address public immutable i_owner;

    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;

    AggregatorV3Interface public priceFeed;

    modifier onlyOwner() {
        // custom error saves gas because we don't need to store the string error message
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }

        _; // continue with the rest of the code
    }

    constructor(address priceFeedAddress) {
        // when the contract is deployed, we keep track of who deployed it
        // so only they can withdraw the funds
        i_owner = msg.sender;

        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        // set a minimum in USD
        // msg.value is the value in wei of ETH
        // if this condition is not met, all the gas above this line is used
        // and all the gas below this function is reverted aka sent back
        require(
            msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,
            "Didn't send enough!"
        );

        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] = msg.value;
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }

        // reset the funders array
        funders = new address[](0);

        // call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }
}
