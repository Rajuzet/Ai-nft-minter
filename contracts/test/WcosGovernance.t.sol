// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/WcosGovernanceToken.sol";
import "../src/WcosGovernor.sol";
import "../src/WcosStaking.sol";

contract WcosGovernanceTest is Test {
    WcosGovernanceToken public token;
    WcosGovernor public governor;
    WcosStaking public staking;

    address public owner = address(1);
    address public memberA = address(2);
    address public memberB = address(3);

    function setUp() public {
        vm.deal(owner, 100 ether);
        vm.deal(memberA, 100 ether);
        vm.deal(memberB, 100 ether);

        vm.startPrank(owner);
        token = new WcosGovernanceToken("WCOS Governance", "WGT", 1000000 * 10**18);
        governor = new WcosGovernor(token, 10, 100); // 10% quorum, 100 blocks duration
        staking = new WcosStaking(address(token), address(token), 1);
        
        // Fund staking contract with rewards
        token.transfer(address(staking), 50000 * 10**18);
        
        // Distribute governance tokens
        token.transfer(memberA, 1000 * 10**18);
        token.transfer(memberB, 1000 * 10**18);
        vm.stopPrank();
    }

    function testCheckpoints() public {
        vm.startPrank(memberA);
        // Delegate to self to create checkpoints
        token.delegate(memberA);
        assertEq(token.getPastVotes(memberA, block.number - 1), 1000 * 10**18);
        vm.stopPrank();
    }

    function testProposalState() public {
        vm.startPrank(memberA);
        token.delegate(memberA);

        uint256 proposalId = governor.propose(
            address(0),
            0,
            "",
            "Upgrade visual modules proposal"
        );

        // Verify state is Active
        assertEq(uint256(governor.state(proposalId)), uint256(WcosGovernor.ProposalState.Active));
        vm.stopPrank();
    }

    function testStakeAndWithdraw() public {
        vm.startPrank(memberB);
        token.approve(address(staking), 500 * 10**18);
        
        // Stake tokens
        staking.stake(500 * 10**18);
        assertEq(staking.balances(memberB), 500 * 10**18);

        // Withdraw tokens
        staking.withdraw(200 * 10**18);
        assertEq(staking.balances(memberB), 300 * 10**18);
        vm.stopPrank();
    }
}
