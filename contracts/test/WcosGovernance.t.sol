// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/WcosGovernanceToken.sol";
import "../src/WcosGovernor.sol";
import "../src/WcosTreasury.sol";
import "../src/WcosStaking.sol";
import "../src/WcosMarketplace.sol";
import "../src/WcosNFTCollection.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

contract WcosGovernanceTest is Test {
    WcosGovernanceToken public token;
    WcosGovernor public governor;
    WcosTreasury public treasury;
    WcosStaking public staking;

    address public owner = address(0x1111);
    address public memberA = address(0x2222);
    address public memberB = address(0x3333);
    address public recipient = address(0x4444);

    uint256 constant QUORUM_PERCENT = 10;
    uint256 constant VOTING_DURATION = 100;

    function setUp() public {
        vm.deal(owner, 100 ether);
        vm.deal(memberA, 100 ether);
        vm.deal(memberB, 100 ether);

        vm.startPrank(owner);
        token = new WcosGovernanceToken("WCOS Governance", "WGT", 1_000_000 * 10 ** 18);
        governor = new WcosGovernor(token, QUORUM_PERCENT, VOTING_DURATION, address(0));
        treasury = new WcosTreasury(address(governor));
        staking = new WcosStaking(address(token), address(token), 1);

        token.transfer(address(staking), 50_000 * 10 ** 18);
        token.transfer(memberA, 100_000 * 10 ** 18);
        token.transfer(memberB, 100_000 * 10 ** 18);
        payable(address(treasury)).transfer(10 ether);
        vm.stopPrank();
    }

    function testTokenBasicInfo() public {
        assertEq(token.name(), "WCOS Governance");
        assertEq(token.symbol(), "WGT");
        assertEq(token.decimals(), 18);
        assertGt(token.totalSupply(), 0);
    }

    function testDelegateAndCheckpoints() public {
        vm.startPrank(memberA);
        token.delegate(memberA);
        vm.roll(block.number + 1);
        uint256 votes = token.getPastVotes(memberA, block.number - 1);
        assertEq(votes, 100_000 * 10 ** 18);
        vm.stopPrank();
    }

    function testDelegateToAnother() public {
        vm.startPrank(memberA);
        token.delegate(memberB);
        vm.roll(block.number + 1);
        uint256 bVotes = token.getPastVotes(memberB, block.number - 1);
        assertEq(bVotes, 100_000 * 10 ** 18);
        uint256 aVotes = token.getPastVotes(memberA, block.number - 1);
        assertEq(aVotes, 0);
        vm.stopPrank();
    }

    function testProposalStateActive() public {
        vm.startPrank(memberA);
        uint256 proposalId = governor.propose(address(0), 0, "", "Test proposal");
        vm.roll(block.number + 50);
        assertEq(uint256(governor.state(proposalId)), uint256(WcosGovernor.ProposalState.Active));
        vm.stopPrank();
    }

    function testProposalDefeatedByQuorum() public {
        vm.startPrank(memberA);
        uint256 proposalId = governor.propose(address(0), 0, "", "Quorum failure");
        vm.roll(block.number + VOTING_DURATION + 1);
        assertEq(uint256(governor.state(proposalId)), uint256(WcosGovernor.ProposalState.Defeated));
        vm.stopPrank();
    }

    function testProposalSucceeded() public {
        vm.startPrank(memberA);
        token.delegate(memberA);
        vm.roll(block.number + 1);
        uint256 proposalId = governor.propose(address(0), 0, "", "Winning proposal");
        governor.castVote(proposalId, true);
        vm.stopPrank();

        vm.startPrank(memberB);
        token.delegate(memberB);
        vm.roll(block.number + 1);
        governor.castVote(proposalId, true);
        vm.stopPrank();

        vm.roll(block.number + VOTING_DURATION + 1);
        assertEq(uint256(governor.state(proposalId)), uint256(WcosGovernor.ProposalState.Succeeded));
    }

    function testCastVoteFor() public {
        vm.startPrank(memberA);
        token.delegate(memberA);
        vm.roll(block.number + 1);
        uint256 proposalId = governor.propose(address(0), 0, "", "Vote test");
        governor.castVote(proposalId, true);
        assertTrue(governor.hasVoted(proposalId, memberA));
        (uint256 forVotes,) = governor.proposalVotes(proposalId);
        assertGt(forVotes, 0);
        vm.stopPrank();
    }

    function testDuplicateVoteReverts() public {
        vm.startPrank(memberA);
        token.delegate(memberA);
        vm.roll(block.number + 1);
        uint256 proposalId = governor.propose(address(0), 0, "", "Dup vote test");
        governor.castVote(proposalId, true);
        vm.expectRevert("WcosGovernor: already voted");
        governor.castVote(proposalId, true);
        vm.stopPrank();
    }

    function testVoteAfterPeriodReverts() public {
        vm.startPrank(memberA);
        token.delegate(memberA);
        vm.roll(block.number + 1);
        uint256 proposalId = governor.propose(address(0), 0, "", "Late vote test");
        vm.roll(block.number + VOTING_DURATION + 1);
        vm.expectRevert("WcosGovernor: voting closed");
        governor.castVote(proposalId, true);
        vm.stopPrank();
    }

    function testProposerCanCancel() public {
        vm.startPrank(memberA);
        token.delegate(memberA);
        vm.roll(block.number + 1);
        uint256 proposalId = governor.propose(address(0), 0, "", "Cancel test");
        governor.cancel(proposalId);
        assertEq(uint256(governor.state(proposalId)), uint256(WcosGovernor.ProposalState.Canceled));
        vm.stopPrank();
    }

    function testNonProposerCancelReverts() public {
        vm.startPrank(memberA);
        uint256 proposalId = governor.propose(address(0), 0, "", "Cancel auth test");
        vm.stopPrank();

        vm.startPrank(memberB);
        vm.expectRevert("WcosGovernor: only proposer can cancel");
        governor.cancel(proposalId);
        vm.stopPrank();
    }

    function testVoteOnCanceledReverts() public {
        vm.startPrank(memberA);
        token.delegate(memberA);
        vm.roll(block.number + 1);
        uint256 proposalId = governor.propose(address(0), 0, "", "Cancel vote test");
        governor.cancel(proposalId);
        vm.expectRevert("WcosGovernor: proposal canceled");
        governor.castVote(proposalId, true);
        vm.stopPrank();
    }

    function testExecuteInformationalProposal() public {
        vm.startPrank(memberA);
        token.delegate(memberA);
        vm.roll(block.number + 1);
        uint256 proposalId = governor.propose(address(0), 0, "", "Informational proposal");
        governor.castVote(proposalId, true);
        vm.stopPrank();

        vm.startPrank(memberB);
        token.delegate(memberB);
        vm.roll(block.number + 1);
        governor.castVote(proposalId, true);
        vm.stopPrank();

        vm.roll(block.number + VOTING_DURATION + 1);
        governor.execute(proposalId);
        assertEq(uint256(governor.state(proposalId)), uint256(WcosGovernor.ProposalState.Executed));
    }

    function testDuplicateExecuteReverts() public {
        vm.startPrank(memberA);
        token.delegate(memberA);
        vm.roll(block.number + 1);
        uint256 proposalId = governor.propose(address(0), 0, "", "Dup execute test");
        governor.castVote(proposalId, true);
        vm.stopPrank();

        vm.startPrank(memberB);
        token.delegate(memberB);
        vm.roll(block.number + 1);
        governor.castVote(proposalId, true);
        vm.stopPrank();

        vm.roll(block.number + VOTING_DURATION + 1);
        governor.execute(proposalId);

        vm.expectRevert("WcosGovernor: already executed");
        governor.execute(proposalId);
    }

    function testExecuteBeforeVotingEndsReverts() public {
        vm.startPrank(memberA);
        uint256 proposalId = governor.propose(address(0), 0, "", "Early execute test");
        vm.expectRevert("WcosGovernor: voting still active");
        governor.execute(proposalId);
        vm.stopPrank();
    }

    function testQuorumNotMetReverts() public {
        vm.startPrank(memberA);
        uint256 proposalId = governor.propose(address(0), 0, "", "No quorum test");
        vm.stopPrank();
        vm.roll(block.number + VOTING_DURATION + 1);
        vm.expectRevert("WcosGovernor: quorum not met");
        governor.execute(proposalId);
    }

    function testTreasuryOwnerCanRelease() public {
        vm.startPrank(owner);
        uint256 beforeBalance = recipient.balance;
        treasury.executeRelease(payable(recipient), 1 ether);
        assertEq(recipient.balance, beforeBalance + 1 ether);
        vm.stopPrank();
    }

    function testTreasuryUnauthorizedReverts() public {
        vm.startPrank(memberA);
        vm.expectRevert("WcosTreasury: caller is not authorized");
        treasury.executeRelease(payable(recipient), 1 ether);
        vm.stopPrank();
    }

    function testStakeAndWithdraw() public {
        vm.startPrank(memberB);
        token.approve(address(staking), 500 * 10 ** 18);
        staking.stake(500 * 10 ** 18);
        assertEq(staking.balances(memberB), 500 * 10 ** 18);
        assertEq(staking.lockDurations(memberB), 30);
        assertEq(staking.unlockTimes(memberB), block.timestamp + 30 days);
        vm.warp(block.timestamp + 10 days);
        vm.expectRevert("WcosStaking: tokens are locked");
        staking.withdraw(200 * 10 ** 18);
        vm.warp(block.timestamp + 21 days);
        staking.withdraw(200 * 10 ** 18);
        assertEq(staking.balances(memberB), 300 * 10 ** 18);
        vm.stopPrank();
    }

    function testEmergencyWithdraw() public {
        vm.startPrank(memberB);
        token.approve(address(staking), 500 * 10 ** 18);
        staking.stake(500 * 10 ** 18, 365);
        vm.warp(block.timestamp + 100 days);
        vm.expectRevert("WcosStaking: tokens are locked");
        staking.withdraw(500 * 10 ** 18);
        uint256 balanceBefore = token.balanceOf(memberB);
        staking.emergencyWithdraw();
        assertEq(staking.balances(memberB), 0);
        assertEq(token.balanceOf(memberB), balanceBefore + 500 * 10 ** 18);
        vm.stopPrank();
    }

    function testTokenTransferCheckpoints() public {
        vm.startPrank(memberA);
        token.delegate(memberA);
        vm.stopPrank();

        vm.startPrank(memberB);
        token.delegate(memberB);
        vm.stopPrank();

        vm.roll(10);
        uint256 aVotesBefore = token.getPastVotes(memberA, 9);
        uint256 bVotesBefore = token.getPastVotes(memberB, 9);
        assertEq(aVotesBefore, 100_000 * 10 ** 18);
        assertEq(bVotesBefore, 100_000 * 10 ** 18);

        // Transfer tokens from A to B
        vm.prank(memberA);
        token.transfer(memberB, 40_000 * 10 ** 18);

        vm.roll(11);
        uint256 aVotesAfter = token.getPastVotes(memberA, 10);
        uint256 bVotesAfter = token.getPastVotes(memberB, 10);
        assertEq(aVotesAfter, 60_000 * 10 ** 18);
        assertEq(bVotesAfter, 140_000 * 10 ** 18);
    }

    function testOwnable2Step() public {
        vm.startPrank(owner);
        token.transferOwnership(memberA);
        assertEq(token.owner(), owner);
        assertEq(token.pendingOwner(), memberA);
        vm.stopPrank();

        vm.prank(memberA);
        token.acceptOwnership();
        assertEq(token.owner(), memberA);
    }

    function testStakingPausable() public {
        vm.prank(owner);
        staking.pause();
        assertTrue(staking.paused());

        vm.startPrank(memberB);
        token.approve(address(staking), 500 * 10 ** 18);
        vm.expectRevert("Pausable: paused");
        staking.stake(500 * 10 ** 18);
        vm.stopPrank();

        vm.prank(owner);
        staking.unpause();

        vm.startPrank(memberB);
        staking.stake(500 * 10 ** 18);
        vm.stopPrank();

        vm.prank(owner);
        staking.pause();

        vm.startPrank(memberB);
        vm.warp(block.timestamp + 31 days);
        staking.withdraw(500 * 10 ** 18);
        assertEq(staking.balances(memberB), 0);
        vm.stopPrank();
    }

    function testMarketplacePausable() public {
        vm.startPrank(owner);
        WcosMarketplace mkt = new WcosMarketplace();
        WcosNFTCollection col = new WcosNFTCollection("Test NFT", "TNFT", 100, 500, address(0x5555));
        uint256 tokenId = col.mintToken(owner, "ipfs://uri");
        col.approve(address(mkt), tokenId);

        mkt.pause();
        assertTrue(mkt.paused());

        vm.expectRevert("Pausable: paused");
        mkt.listToken(address(col), tokenId, 1 ether);
        vm.stopPrank();
    }

    function testMarketplaceFees() public {
        vm.startPrank(owner);
        WcosMarketplace mkt = new WcosMarketplace();
        WcosNFTCollection col = new WcosNFTCollection("Test NFT", "TNFT", 100, 500, address(0x5555));
        
        address feeCollector = address(0x6666);
        mkt.setFeeBps(250);
        mkt.setFeeRecipient(feeCollector);

        uint256 tokenId = col.mintToken(owner, "ipfs://uri");
        col.approve(address(mkt), tokenId);
        uint256 listingId = mkt.listToken(address(col), tokenId, 10 ether);
        vm.stopPrank();

        address buyerAddress = address(0x7777);
        vm.deal(buyerAddress, 20 ether);

        uint256 ownerBefore = owner.balance;
        uint256 royaltyBefore = address(0x5555).balance;
        uint256 feeBefore = feeCollector.balance;

        vm.prank(buyerAddress);
        mkt.buyToken{value: 10 ether}(listingId);

        assertEq(address(0x5555).balance - royaltyBefore, 0.5 ether);
        assertEq(feeCollector.balance - feeBefore, 0.25 ether);
        assertEq(owner.balance - ownerBefore, 9.25 ether);
    }

    function testGovernanceTimelock() public {
        vm.startPrank(owner);
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](0);
        TimelockController tLock = new TimelockController(
            1 days,
            proposers,
            executors,
            owner
        );

        WcosGovernor tGov = new WcosGovernor(token, QUORUM_PERCENT, VOTING_DURATION, address(tLock));

        tLock.grantRole(tLock.PROPOSER_ROLE(), address(tGov));
        tLock.grantRole(tLock.EXECUTOR_ROLE(), address(tGov));
        tLock.grantRole(tLock.EXECUTOR_ROLE(), address(0));
        vm.stopPrank();

        vm.startPrank(memberA);
        token.delegate(memberA);
        vm.roll(block.number + 1);
        uint256 proposalId = tGov.propose(address(0), 0, "", "Timelock test");
        tGov.castVote(proposalId, true);
        vm.stopPrank();

        vm.startPrank(memberB);
        token.delegate(memberB);
        vm.roll(block.number + 1);
        tGov.castVote(proposalId, true);
        vm.stopPrank();

        vm.roll(block.number + VOTING_DURATION + 1);
        assertEq(uint256(tGov.state(proposalId)), uint256(WcosGovernor.ProposalState.Succeeded));

        tGov.queue(proposalId);
        assertEq(uint256(tGov.state(proposalId)), uint256(WcosGovernor.ProposalState.Queued));

        vm.expectRevert("WcosGovernor: timelock delay not passed");
        tGov.execute(proposalId);

        vm.warp(block.timestamp + 1 days + 1);
        tGov.execute(proposalId);
        assertEq(uint256(tGov.state(proposalId)), uint256(WcosGovernor.ProposalState.Executed));
    }
}
