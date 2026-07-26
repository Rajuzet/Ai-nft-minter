// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/WcosGovernanceToken.sol";
import "../src/WcosGovernor.sol";

contract WcosGovernanceTokenRegressionTest is Test {
    WcosGovernanceToken public token;
    WcosGovernor public governor;

    address public owner = address(0x1111);
    address public memberA = address(0x2222);
    address public memberB = address(0x3333);
    address public freshWallet = address(0x4444);

    function setUp() public {
        vm.startPrank(owner);
        token = new WcosGovernanceToken("WCOS Governance", "WGT", 1_000_000 * 10 ** 18);
        governor = new WcosGovernor(token, 10, 100, address(0));

        token.transfer(memberA, 100_000 * 10 ** 18);
        token.transfer(memberB, 100_000 * 10 ** 18);
        vm.stopPrank();
    }

    // ── Original regression: checkpoint decreases on transfer ─────────────

    function testCheckpointTransfer() public {
        vm.prank(memberA);
        token.delegate(memberA);

        vm.roll(block.number + 1);
        uint256 votesA = token.getPastVotes(memberA, block.number - 1);
        assertEq(votesA, 100_000 * 10 ** 18);

        vm.prank(memberA);
        token.transfer(memberB, 100_000 * 10 ** 18);

        vm.roll(block.number + 1);

        // memberA's votes must be 0 after transferring all tokens
        uint256 votesAAfter = token.getPastVotes(memberA, block.number - 1);
        assertEq(votesAAfter, 0, "memberA should have 0 votes after transferring all tokens");

        // memberB delegates and gains voting power
        vm.prank(memberB);
        token.delegate(memberB);

        vm.roll(block.number + 1);
        uint256 votesB = token.getPastVotes(memberB, block.number - 1);
        assertEq(votesB, 200_000 * 10 ** 18, "memberB should have combined balance as votes");
    }

    // ── Original regression: double voting prevention ──────────────────────

    function testDoubleVotingPowerPrevention() public {
        vm.prank(memberA);
        token.delegate(memberA);

        vm.roll(block.number + 1);

        vm.prank(memberA);
        uint256 proposalId = governor.propose(address(0), 0, "", "Test double vote");

        vm.prank(memberA);
        governor.castVote(proposalId, true);

        // Transfer tokens to freshWallet after the vote
        vm.prank(memberA);
        token.transfer(freshWallet, 100_000 * 10 ** 18);

        vm.prank(freshWallet);
        token.delegate(freshWallet);

        vm.roll(block.number + 1);

        // freshWallet had 0 tokens at the snapshot block → vote must revert
        vm.expectRevert("WcosGovernor: no voting weight");
        vm.prank(freshWallet);
        governor.castVote(proposalId, true);
    }

    // ── NEW: Non-delegating holder gets 0 voting weight (intentional) ─────

    /**
     * @notice A holder who NEVER calls delegate() must have 0 voting weight.
     *
     *         This is correct and intentional — it matches OZ ERC20Votes
     *         semantics where delegation is opt-in.  Without explicit
     *         delegation, token balances don't confer voting power (cheaper
     *         transfers, no surprise checkpoint writes).
     *
     *         The test documents this behaviour so a future developer doesn't
     *         accidentally "fix" it by restoring the balanceOf() fallback in
     *         WcosGovernor.castVote(), which was the original vulnerability.
     */
    function testNonDelegatorGetsZeroVotingWeight() public {
        // memberA holds 100k tokens but has NEVER called delegate()
        // (setUp transfers tokens directly, no delegate call)
        assertGt(token.balanceOf(memberA), 0, "pre-condition: memberA has tokens");

        vm.roll(block.number + 1);

        // getPastVotes returns 0 — no checkpoint exists
        uint256 votes = token.getPastVotes(memberA, block.number - 1);
        assertEq(votes, 0, "non-delegator must have 0 past votes");

        // Trying to vote must revert (not silently count 0 or fall back to balanceOf)
        vm.prank(memberB); // memberB also hasn't delegated; propose using token balance check
        uint256 proposalId = governor.propose(address(0), 0, "", "Non-delegator vote test");

        vm.prank(memberA);
        vm.expectRevert("WcosGovernor: no voting weight");
        governor.castVote(proposalId, true);
    }

    // ── NEW: auto-delegation on mint() gives immediate voting power ────────

    /**
     * @notice After Phase 0 fix: tokens minted via owner-callable mint()
     *         auto-self-delegate, so the recipient has immediate voting power
     *         without a separate delegate() call.
     */
    function testMintAutoSelfDelegate() public {
        address newHolder = address(0x5555);
        uint256 mintAmount = 50_000 * 10 ** 18;

        vm.prank(owner);
        token.mint(newHolder, mintAmount);

        vm.roll(block.number + 1);

        uint256 votes = token.getPastVotes(newHolder, block.number - 1);
        assertEq(votes, mintAmount, "minted recipient should be auto-self-delegated");
    }

    // ── NEW: auto-delegation is idempotent (double-mint doesn't break) ─────

    function testMintAutoSelfDelegate_Idempotent() public {
        address newHolder = address(0x6666);

        vm.startPrank(owner);
        token.mint(newHolder, 10_000 * 10 ** 18);
        // Second mint to same address — delegate() not called again (already set)
        token.mint(newHolder, 5_000 * 10 ** 18);
        vm.stopPrank();

        vm.roll(block.number + 1);

        uint256 votes = token.getPastVotes(newHolder, block.number - 1);
        assertEq(votes, 15_000 * 10 ** 18, "second mint must not overwrite delegation");
    }

    // ── Phase 0b: mint auto-delegate then transfer away \u2014 checkpoint drops ─

    /**
     * @notice Regression: after mint() auto-self-delegates a recipient,
     *         transferring those tokens away must correctly DECREASE the
     *         recipient's checkpoint to 0 (via _afterTokenTransfer \u2192 _moveDelegates).
     *
     *         This proves that the auto-delegation added in Phase 0 did NOT
     *         break the original checkpoint-on-transfer bug fix.
     *
     *         Sequence:
     *           1. owner.mint(newHolder, 50_000e18) \u2192 auto-self-delegates
     *              \u2192 newHolder.checkpoint = 50_000e18
     *           2. newHolder.transfer(stranger, 50_000e18)
     *              \u2192 _afterTokenTransfer \u2192 _moveDelegates(newHolder, address(0), 50_000e18)
     *              \u2192 newHolder.checkpoint decreases to 0
     *           3. getPastVotes(newHolder) must equal 0
     */
    function testMintAutoDelegate_ThenTransfer_CheckpointDropsToZero() public {
        address newHolder = address(0x7777);
        address stranger  = address(0x8888);
        uint256 mintAmount = 50_000 * 10 ** 18;

        // Step 1: mint (auto-self-delegates newHolder)
        vm.prank(owner);
        token.mint(newHolder, mintAmount);

        vm.roll(block.number + 1);
        uint256 votesAfterMint = token.getPastVotes(newHolder, block.number - 1);
        assertEq(votesAfterMint, mintAmount, "after mint: checkpoint must equal minted amount");

        // Step 2: transfer all tokens away
        vm.prank(newHolder);
        token.transfer(stranger, mintAmount);

        vm.roll(block.number + 1);

        // Step 3: checkpoint must drop to 0 (stranger hasn't delegated, so their votes stay 0 too)
        uint256 votesAfterTransfer = token.getPastVotes(newHolder, block.number - 1);
        assertEq(votesAfterTransfer, 0, "after transfer-away: newHolder checkpoint must be 0");

        // stranger never delegated \u2014 they also have 0 votes (intentional, opt-in delegation)
        uint256 strangerVotes = token.getPastVotes(stranger, block.number - 1);
        assertEq(strangerVotes, 0, "stranger (no delegation) must have 0 votes");
    }
}
