// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Script.sol";
import "../src/WcosGovernanceToken.sol";
import "../src/WcosStaking.sol";

contract DeployStaking is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy WcosGovernanceToken (WGT)
        WcosGovernanceToken token = new WcosGovernanceToken(
            "WCOS Governance",
            "WGT",
            1000000 * 10**18
        );

        // Deploy WcosStaking with rewardRate = 1 token/sec or 1 unit
        WcosStaking staking = new WcosStaking(
            address(token),
            address(token),
            1 * 10**18
        );

        // Fund staking contract with 100,000 WGT rewards
        token.transfer(address(staking), 100000 * 10**18);

        // Print deployed addresses
        console.log("WcosGovernanceToken deployed at:", address(token));
        console.log("WcosStaking deployed at:", address(staking));

        vm.stopBroadcast();
    }
}
