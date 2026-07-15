// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Script.sol";
import "../src/WcosGovernanceToken.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../src/WcosGovernor.sol";
import "../src/WcosTreasury.sol";
import "../src/AINFTMinter.sol";
import "../src/WcosMarketplace.sol";
import "../src/WcosMembership.sol";
import "../src/WcosStaking.sol";

contract DeployAll is Script {
    uint256 constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18; // 1M WGT
    uint256 constant QUORUM_PERCENTAGE = 10;                // 10%
    uint256 constant VOTING_DURATION_BLOCKS = 100;             // ~20 mins on Base Sepolia
    uint256 constant REWARD_RATE = 1 * 10 ** 18;            // 1 token/sec

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        WcosGovernanceToken token;
        TimelockController timelock;
        WcosGovernor governor;
        WcosTreasury treasury;
        AINFTMinter minter;
        WcosMarketplace marketplace;
        WcosMembership membership;
        WcosStaking staking;

        // 1. Deployments
        {
            token = new WcosGovernanceToken(
                "WCOS Governance Token",
                "WGT",
                INITIAL_SUPPLY
            );
            console.log("WcosGovernanceToken deployed at:", address(token));

            uint256 minDelay = 0;
            if (block.chainid == 84532 || block.chainid == 8453 || block.chainid == 1) {
                minDelay = 2 days;
            }

            address[] memory proposers = new address[](0);
            address[] memory executors = new address[](0);
            timelock = new TimelockController(
                minDelay,
                proposers,
                executors,
                deployer // temporary admin
            );
            console.log("TimelockController deployed at:", address(timelock));

            governor = new WcosGovernor(
                token,
                QUORUM_PERCENTAGE,
                VOTING_DURATION_BLOCKS,
                address(timelock)
            );
            console.log("WcosGovernor deployed at:", address(governor));

            treasury = new WcosTreasury(address(timelock));
            console.log("WcosTreasury deployed at:", address(treasury));

            minter = new AINFTMinter();
            console.log("AINFTMinter deployed at:", address(minter));

            marketplace = new WcosMarketplace();
            console.log("WcosMarketplace deployed at:", address(marketplace));

            membership = new WcosMembership(
                "WCOS Membership",
                "WMEM",
                "https://wcos.io/metadata/{id}.json"
            );
            console.log("WcosMembership deployed at:", address(membership));

            staking = new WcosStaking(
                address(token),
                address(token),
                REWARD_RATE
            );
            console.log("WcosStaking deployed at:", address(staking));
        }

        // 2. Initial setup and funding
        {
            token.transfer(address(staking), 100_000 * 10 ** 18);
            console.log("Funded WcosStaking rewards pool with 100,000 WGT");

            token.delegate(deployer);
            console.log("Self-delegated deployer voting power");

            // Grant governor proposer, executor, and canceller rights
            timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
            timelock.grantRole(timelock.EXECUTOR_ROLE(), address(governor));
            timelock.grantRole(timelock.CANCELLER_ROLE(), address(governor));

            // Also allow open execution (anyone can execute scheduled transactions)
            timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0));

            // Revoke temporary deployer admin privileges
            timelock.revokeRole(timelock.TIMELOCK_ADMIN_ROLE(), deployer);
            console.log("Configured Timelock roles and revoked temporary deployer admin");

            marketplace.setFeeRecipient(address(treasury));
            console.log("Configured Marketplace fee recipient to Treasury");
        }

        // 3. Ownership transfers
        {
            minter.transferOwnership(address(timelock));
            marketplace.transferOwnership(address(timelock));
            membership.transferOwnership(address(timelock));
            staking.transferOwnership(address(timelock));
            treasury.transferOwnership(address(timelock));
            console.log("Transferred ownerships of Minter, Marketplace, Membership, Staking, and Treasury to Timelock");
        }

        vm.stopBroadcast();

        console.log("\n=== Full Deployment Completed Successfully ===");
        console.log("Token:       ", address(token));
        console.log("Timelock:    ", address(timelock));
        console.log("Governor:    ", address(governor));
        console.log("Treasury:    ", address(treasury));
        console.log("Minter:      ", address(minter));
        console.log("Marketplace: ", address(marketplace));
        console.log("Membership:  ", address(membership));
        console.log("Staking:     ", address(staking));
    }
}
