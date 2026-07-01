// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";

/// @title WcosRevenueSplitter
/// @notice Wraps OpenZeppelin PaymentSplitter to split ETH and ERC-20 royalty
///         payouts across multiple creator wallets with configurable shares.
contract WcosRevenueSplitter is PaymentSplitter {

    string public splitName;

    event SplitCreated(string name, address[] payees, uint256[] shares);

    constructor(
        string memory _name,
        address[] memory payees,
        uint256[] memory shares
    ) PaymentSplitter(payees, shares) {
        splitName = _name;
        emit SplitCreated(_name, payees, shares);
    }
}
