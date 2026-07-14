// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Script.sol";
import "../src/WcosGovernanceToken.sol";
import "../src/WcosGovernor.sol";
import "../src/WcosTreasury.sol";

/// @notice Deploy governance system: Token + Governor + Treasury
/// @dev Run with: forge script script/DeployGovernance.s.sol --rpc-url $RPC_URL --broadcast --verify
contract DeployGovernance is Script {
    // Configuration
    uint256 constant INITIAL_SUPPLY       = 1_000_000 * 10 ** 18; // 1M WGT
    uint256 constant QUORUM_PERCENTAGE    = 10;                    // 10%
    uint256 constant VOTING_DURATION_BLOCKS = 100;                 // ~20 min on Base Sepolia

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // 1. Deploy governance token
        WcosGovernanceToken govToken = new WcosGovernanceToken(
            "WCOS Governance Token",
            "WGT",
            INITIAL_SUPPLY
        );
        console2.log("WcosGovernanceToken deployed at:", address(govToken));
        console2.log("  NEXT_PUBLIC_WCOS_GOVERNANCE_TOKEN_ADDRESS=%s", address(govToken));

        // 2. Deploy governor with token
        WcosGovernor governor = new WcosGovernor(
            govToken,
            QUORUM_PERCENTAGE,
            VOTING_DURATION_BLOCKS
        );
        console2.log("WcosGovernor deployed at:", address(governor));
        console2.log("  NEXT_PUBLIC_WCOS_GOVERNOR_ADDRESS=%s", address(governor));

        // 3. Deploy treasury controlled by governor
        WcosTreasury treasury = new WcosTreasury(address(governor));
        console2.log("WcosTreasury deployed at:", address(treasury));
        console2.log("  NEXT_PUBLIC_WCOS_TREASURY_ADDRESS=%s", address(treasury));

        // 4. Self-delegate deployer tokens to activate voting power
        govToken.delegate(deployer);
        console2.log("Deployer self-delegated voting power");

        vm.stopBroadcast();

        // Summary for env var setup
        console2.log("\n=== Governance Deployment Summary ===");
        console2.log("Chain ID:        %s", block.chainid);
        console2.log("Deployer:        %s", deployer);
        console2.log("Token:           %s", address(govToken));
        console2.log("Governor:        %s", address(governor));
        console2.log("Treasury:        %s", address(treasury));
        console2.log("\nAdd to .env.local:");
        console2.log("NEXT_PUBLIC_WCOS_GOVERNANCE_TOKEN_ADDRESS=%s", address(govToken));
        console2.log("NEXT_PUBLIC_WCOS_GOVERNOR_ADDRESS=%s", address(governor));
        console2.log("NEXT_PUBLIC_WCOS_TREASURY_ADDRESS=%s", address(treasury));
    }
}
