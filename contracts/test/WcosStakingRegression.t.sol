// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/WcosGovernanceToken.sol";
import "../src/WcosStaking.sol";

/**
 * @title WcosStakingRegressionTest
 *
 * Test parameters (chosen to give clean integer arithmetic):
 *   rewardsDuration = 10_000 seconds
 *   POOL            = 10_000 WGT
 *   rewardRate      = POOL / rewardsDuration = 1e18 tokens/second
 *
 * With a single staker of 100 WGT:
 *   earned per second = rewardRate × 100e18 / 100e18 / 1e18 = 1 token/second
 *   After 10 seconds  → 10 tokens
 *   After 10_000 s   → 10_000 tokens (pool fully distributed, capped by periodFinish)
 */
contract WcosStakingRegressionTest is Test {
    WcosGovernanceToken public token;
    WcosStaking public staking;

    address public owner = address(0x1111);
    address public user  = address(0x2222);

    uint256 constant REWARDS_DURATION = 10_000; // seconds → rewardRate = 1e18/s
    uint256 constant POOL             = 10_000 * 10 ** 18;

    function setUp() public {
        vm.startPrank(owner);
        token = new WcosGovernanceToken("WCOS Governance", "WGT", 1_000_000 * 10 ** 18);

        // Constructor takes rewardsDuration (not rewardRate) — see WcosStaking NatSpec
        staking = new WcosStaking(address(token), address(token), REWARDS_DURATION);

        // Fund the reward pool, then activate with notifyRewardAmount
        token.transfer(address(staking), POOL);
        staking.notifyRewardAmount(POOL);
        // After this: rewardRate = POOL / REWARDS_DURATION = 1e18 tokens/second
        // periodFinish = block.timestamp + 10_000

        // Fund the user
        token.transfer(user, 1_000 * 10 ** 18);
        vm.stopPrank();
    }

    // ── Original regression: back-to-back claims ──────────────────────────

    function testStakingDoubleClaimAndRewardsAccrual() public {
        vm.startPrank(user);
        token.approve(address(staking), 100 * 10 ** 18);
        staking.stake(100 * 10 ** 18, 30);

        assertEq(staking.balances(user), 100 * 10 ** 18);

        // Warp 10 seconds → user earns 10 WGT (100% of pool for 10s)
        vm.warp(block.timestamp + 10);

        uint256 balanceBefore = token.balanceOf(user);
        staking.claimRewards();
        uint256 rewardPaid = token.balanceOf(user) - balanceBefore;
        assertGt(rewardPaid, 0, "first claim should pay something");

        // Immediate second claim — must revert (rewards[user] == 0 and no time elapsed)
        vm.expectRevert("WcosStaking: no rewards to claim");
        staking.claimRewards();

        // After 100 more seconds, can claim again
        vm.warp(block.timestamp + 100);
        balanceBefore = token.balanceOf(user);
        staking.claimRewards();
        assertGt(token.balanceOf(user) - balanceBefore, 0, "second window claim should pay");

        vm.stopPrank();
    }

    // ── Regression: periodFinish caps total distribution ─────────────────

    /**
     * @notice Verifies that warping past periodFinish does NOT allow claiming
     *         more than the funded pool (replaces the old "reverts on overdrain"
     *         test, which is now prevented by design via periodFinish).
     */
    function testRewardPoolCap_BoundedByPeriodFinish() public {
        vm.startPrank(user);
        token.approve(address(staking), 100 * 10 ** 18);
        staking.stake(100 * 10 ** 18, 30);

        // Warp 2× past periodFinish — without the cap this would earn 20_000 WGT
        // (pool only has 10_000).  The cap must limit earned to ≤ POOL.
        vm.warp(block.timestamp + 20_000);

        uint256 pending = staking.earned(user);
        // Single staker holds 100% of pool → full period distributable to them
        // = rewardRate × rewardsDuration = 1e18 × 10_000 = 10_000 tokens = POOL
        assertLe(pending, POOL, "earned must not exceed funded pool");

        uint256 balanceBefore = token.balanceOf(user);
        staking.claimRewards();
        uint256 claimed = token.balanceOf(user) - balanceBefore;
        assertLe(claimed, POOL, "claimed must not exceed funded pool");
        // Contract still holds the staked principal
        assertEq(staking.balances(user), 100 * 10 ** 18);

        vm.stopPrank();
    }

    // ── NEW: emergencyWithdraw then claimRewards pays 0 ──────────────────

    /**
     * @notice Regression for emergencyWithdraw CEI and post-exit reward state.
     *
     *         Sequence:
     *           1. Stake and accrue rewards for 50 seconds.
     *           2. Call emergencyWithdraw() — must forfeit accrued rewards.
     *           3. Immediately call claimRewards() — must revert with
     *              "no rewards to claim" (not pay stale rewards).
     *           4. Verify principal was returned, staking balance is 0,
     *              totalStaked was correctly decremented BEFORE the transfer.
     */
    function testEmergencyWithdrawThenClaimPaysZero() public {
        vm.startPrank(user);
        token.approve(address(staking), 200 * 10 ** 18);
        staking.stake(200 * 10 ** 18, 30);

        // Accrue 50 seconds of rewards
        vm.warp(block.timestamp + 50);

        // Sanity: there are pending rewards before the emergency exit
        assertGt(staking.earned(user), 0, "pre-condition: should have pending rewards");

        uint256 principalBefore = token.balanceOf(user);

        // Emergency withdraw
        staking.emergencyWithdraw();

        // Principal returned
        assertEq(token.balanceOf(user), principalBefore + 200 * 10 ** 18, "principal must be returned");

        // Internal state wiped
        assertEq(staking.balances(user), 0, "staked balance must be 0");
        assertEq(staking.totalStaked(), 0, "totalStaked must be decremented");
        assertEq(staking.rewards(user), 0, "rewards mapping must be zeroed");

        // earned() must return 0 post-exit (userRewardPerTokenPaid synced in emergencyWithdraw)
        assertEq(staking.earned(user), 0, "earned() must return 0 after emergency withdraw");

        // claimRewards must revert — not silently pay 0
        vm.expectRevert("WcosStaking: no rewards to claim");
        staking.claimRewards();

        vm.stopPrank();
    }

    // ── NEW: apy multiplier is gone — verify Synthetix formula is linear ──

    /**
     * @notice Verifies that the removed apy/8 multiplier is truly gone.
     *         Two stakers with identical balance but different lock durations
     *         earn exactly the same reward (pro-rata by balance).
     */
    function testSameLockDurationEarnsSameRewards() public {
        address user2 = address(0x3333);
        vm.prank(owner);
        token.transfer(user2, 1_000 * 10 ** 18);

        // Both stake 100 tokens but with different lock durations
        vm.startPrank(user);
        token.approve(address(staking), 100 * 10 ** 18);
        staking.stake(100 * 10 ** 18, 30);
        vm.stopPrank();

        vm.startPrank(user2);
        token.approve(address(staking), 100 * 10 ** 18);
        staking.stake(100 * 10 ** 18, 365);
        vm.stopPrank();

        vm.warp(block.timestamp + 1_000);

        // With the old bug, user2 (365-day) would earn 2.25× more.
        // With the fix, both earn identically (same balance, same elapsed time).
        uint256 earned1 = staking.earned(user);
        uint256 earned2 = staking.earned(user2);
        assertEq(earned1, earned2, "lock duration must NOT affect earned() amount (apy/8 removed)");
    }

    // ── Phase 0b: notifyRewardAmount() rollover ───────────────────────────

    /**
     * @notice Verifies the Synthetix mid-period rollover: funding again before
     *         periodFinish rolls undistributed tokens into the new rate so no
     *         rewards are silently lost.
     *
     *         Setup:
     *           rewardsDuration = 10_000 s, initial rewardRate = 1e18 token/s
     *           periodFinish = T0 + 10_000 s
     *
     *         Sequence:
     *           1. User stakes 100 WGT at T0 (100% of pool).
     *           2. Warp 5_000 s → user accrues 5_000 WGT from period-1.
     *           3. Owner adds 3_000 WGT and calls notifyRewardAmount(3_000e18).
     *              remaining = 5_000 s, leftover = 5_000 × 1e18 = 5_000e18
     *              newRate   = (3_000e18 + 5_000e18) / 10_000 = 8e17 token/s
     *              newPeriodFinish = T0 + 5_000 + 10_000 = T0 + 15_000 s
     *           4. Warp to T0 + 15_000 (end of new period).
     *
     *         Expected total earned by the single staker:
     *           period-1 (T0 → T0+5000) : 5_000 WGT
     *           period-2 (T0+5000 → T0+15000): newRate × rewardsDuration
     *                                         = 8e17 × 10_000 = 8_000 WGT
     *           TOTAL = 13_000 WGT
     *
     *         Without rollover (fresh rate = 3_000e18 / 10_000 = 3e14/s):
     *           period-2 would only yield 3_000 WGT (5_000 WGT leftover LOST).
     *           Total would be 5_000 + 3_000 = 8_000 WGT.
     *
     *         The 5_000 WGT difference proves the rollover works correctly.
     */
    function testNotifyRewardAmount_Rollover() public {
        vm.startPrank(user);
        token.approve(address(staking), 100 * 10 ** 18);
        staking.stake(100 * 10 ** 18, 30);
        vm.stopPrank();

        // Warp halfway through period 1 — user earns 5_000 WGT (100% of pool, 5000 s × 1 WGT/s)
        vm.warp(block.timestamp + 5_000);

        // Owner adds 3_000 WGT more and calls notifyRewardAmount mid-period.
        uint256 additionalFunding = 3_000 * 10 ** 18;
        vm.startPrank(owner);
        token.transfer(address(staking), additionalFunding);
        staking.notifyRewardAmount(additionalFunding);
        vm.stopPrank();

        // Verify new rewardRate incorporates the leftover
        //   remaining = 5_000 s, leftover = 5_000 × 1e18 = 5_000e18
        //   expectedRate = (3_000e18 + 5_000e18) / 10_000 = 8e17
        uint256 leftover     = 5_000 * 10 ** 18; // remaining * old rewardRate
        uint256 expectedRate = (additionalFunding + leftover) / REWARDS_DURATION;
        assertEq(staking.rewardRate(), expectedRate, "rollover: new rate must incorporate leftover");

        // Warp to the new periodFinish (full rollover period elapsed)
        vm.warp(block.timestamp + REWARDS_DURATION);

        // Correct total breakdown:
        //   Period 1 (T0 → T0+5000)         : 5_000 WGT (already accrued in rewardPerToken)
        //   Period 2 (T0+5000 → T0+15000)    : expectedRate × rewardsDuration = 8_000 WGT
        //   TOTAL                             : 13_000 WGT
        uint256 firstPeriodEarned = 5_000 * 10 ** 18;
        uint256 newPeriodEarned   = expectedRate * REWARDS_DURATION; // 8_000e18
        uint256 expectedTotal     = firstPeriodEarned + newPeriodEarned; // 13_000e18

        uint256 pending = staking.earned(user);
        assertEq(pending, expectedTotal, "rollover: total = first-period (5000) + new-period-with-rollover (8000)");

        // Without rollover: fresh rate = additionalFunding / duration = 3e14/s → only 3_000 WGT in period 2
        // Total without rollover = 5_000 + 3_000 = 8_000 WGT (leftover lost)
        // The 5_000 WGT difference (13_000 vs 8_000) proves no leftover was discarded.
        uint256 noRolloverScenario = firstPeriodEarned + additionalFunding; // 5000 + 3000 = 8000e18
        assertGt(pending, noRolloverScenario, "rollover: earned must exceed fresh-rate scenario (leftover preserved)");

        // Claim succeeds and pays the full correct amount
        uint256 before = token.balanceOf(user);
        vm.prank(user);
        staking.claimRewards();
        assertEq(token.balanceOf(user) - before, expectedTotal, "rollover: claimed amount must match expected total");
    }

    // ── Phase 0b: notifyRewardAmount() solvency check ────────────────────

    /**
     * @notice Verifies that notifyRewardAmount() reverts when the requested
     *         funding exceeds the actual token balance held by the contract.
     *
     *         The setUp() has already funded 10_000 WGT.  Calling notify with
     *         an amount that would require more tokens than the contract holds
     *         (after accounting for totalStaked when token == rewardToken) must
     *         revert with the solvency error.
     */
    function testNotifyRewardAmount_SolvencyCheck_Reverts() public {
        // First, exhaust the period (so no leftover complicates the math)
        vm.warp(block.timestamp + REWARDS_DURATION + 1);

        // Contract holds POOL = 10_000e18 in reward tokens (no stakes in this path).
        // Trying to fund with 50_000e18 (which the contract does NOT hold) must revert.
        uint256 oversizedAmount = 50_000 * 10 ** 18;
        // Note: owner does NOT transfer extra tokens first, so balance is still POOL.
        vm.prank(owner);
        vm.expectRevert("WcosStaking: insufficient reward balance");
        staking.notifyRewardAmount(oversizedAmount);
    }

    /**
     * @notice Complementary: solvency check passes when balance is sufficient.
     */
    function testNotifyRewardAmount_SolvencyCheck_Passes() public {
        // Exhaust current period
        vm.warp(block.timestamp + REWARDS_DURATION + 1);

        // Refund the exact pool size — contract should accept it
        vm.startPrank(owner);
        token.transfer(address(staking), POOL);
        // Now contract holds 2×POOL (original + new transfer).
        // notifyRewardAmount(POOL) sets rewardRate = POOL / REWARDS_DURATION = 1e18
        // rewardRate × rewardsDuration = POOL ≤ balanceOf(staking) ✔
        staking.notifyRewardAmount(POOL);
        vm.stopPrank();
        assertGt(staking.rewardRate(), 0, "solvency pass: rate must be set");
    }

    // ── Phase 0b: emergencyWithdraw zeroes rewards[account] snapshot ──────

    /**
     * @notice Full regression for emergencyWithdraw forfeiture path.
     *
     *         The CRITICAL difference from testEmergencyWithdrawThenClaimPaysZero:
     *         this test forces `rewards[account]` to be NON-ZERO before
     *         emergencyWithdraw by calling stake() twice (the second stake
     *         triggers updateReward, which writes earned() into rewards[account]).
     *
     *         Sequence:
     *           1. Stake 100 WGT.
     *           2. Warp 50 s → earned() > 0 (checkpoint still in flight).
     *           3. Stake 1 more WGT → updateReward runs:
     *                rewards[user] = earned(user)   // now a non-zero snapshot
     *                userRewardPerTokenPaid[user] = rewardPerTokenStored
     *              The non-zero rewards[user] is the exact state testEmergencyWithdrawThenClaimPaysZero
     *              does NOT exercise (it only stakes once, so rewards[user] == 0 before emergencyWithdraw).
     *           4. emergencyWithdraw() must zero BOTH rewards[user] AND sync
     *              userRewardPerTokenPaid so earned() returns 0.
     *           5. claimRewards() must revert.
     */
    function testEmergencyWithdraw_WithSnapshotRewards() public {
        vm.startPrank(user);
        token.approve(address(staking), 1_000 * 10 ** 18);

        // Step 1: first stake
        staking.stake(100 * 10 ** 18, 30);

        // Step 2: warp so rewards accrue
        vm.warp(block.timestamp + 50);

        // Pre-condition: earned() is non-zero before the second stake
        uint256 earnedBeforeSecondStake = staking.earned(user);
        assertGt(earnedBeforeSecondStake, 0, "pre: earned should be non-zero before 2nd stake");

        // Step 3: second stake triggers updateReward → rewards[user] = earned(user) > 0
        staking.stake(1 * 10 ** 18, 30);

        // rewards[user] should now equal the snapshotted amount
        uint256 snapshotted = staking.rewards(user);
        assertGt(snapshotted, 0, "pre: rewards[user] must be non-zero after 2nd stake triggers updateReward");

        // Warp a little more so userRewardPerTokenPaid would also diverge
        vm.warp(block.timestamp + 10);

        // Step 4: emergency withdraw
        uint256 principalBefore = token.balanceOf(user);
        staking.emergencyWithdraw();

        // Principal fully returned (101 WGT)
        assertEq(token.balanceOf(user), principalBefore + 101 * 10 ** 18, "principal must be returned");

        // Both reward stores zeroed
        assertEq(staking.rewards(user), 0, "rewards[user] must be zeroed by emergencyWithdraw");
        assertEq(staking.balances(user), 0, "balances[user] must be zeroed");

        // earned() must return 0 — not the stale snapshotted amount
        assertEq(staking.earned(user), 0, "earned() must return 0 after emergencyWithdraw");

        // Step 5: claimRewards must revert — not silently pay the snapshotted rewards
        vm.expectRevert("WcosStaking: no rewards to claim");
        staking.claimRewards();

        vm.stopPrank();
    }

    /**
     * @notice Verifies that the solvency check in notifyRewardAmount accounts for
     *         the rolled-over leftover from the active period, not just the raw
     *         new reward parameter.
     *
     *         Setup:
     *           - Contract holds initial POOL of 10,000 WGT.
     *           - periodFinish = T0 + 10,000 s (rate = 1e18/s).
     *         Warp to T0 + 5,000 s (halfway):
     *           - leftover = 5,000 s * 1e18 = 5,000 WGT.
     *         Call notifyRewardAmount(6,000 WGT):
     *           - 6,000 WGT is independently affordable (6,000 <= 10,000 WGT contract balance).
     *           - But with rollover, the required pool is: 6,000 + 5,000 = 11,000 WGT.
     *           - 11,000 WGT exceeds the contract's actual balance (10,000 WGT).
     *           - Therefore, it MUST revert.
     */
    function testNotifyRewardAmount_SolvencyCheck_AccountsForRollover() public {
        // Warp halfway through the initial period (5,000 s elapsed)
        vm.warp(block.timestamp + 5_000);

        // Call notifyRewardAmount with 6,000 WGT.
        // It is independently affordable (6,000 WGT <= 10,000 WGT balance).
        // But (6,000 WGT + 5,000 WGT leftover) = 11,000 WGT > 10,000 WGT balance.
        vm.startPrank(owner);
        vm.expectRevert("WcosStaking: insufficient reward balance");
        staking.notifyRewardAmount(6_000 * 10 ** 18);
        vm.stopPrank();
    }

    /**
     * @notice Confirms getApy() does not revert when totalStaked is 0 or periodFinish has passed.
     *         Checks that a live rate is computed correctly based on the formula:
     *         APY = (rewardRate * 31536000 * 100) / totalStaked
     *
     *         Expected values (derived independently):
     *           - totalStaked = 0: APY = 0
     *           - rewardRate = 1e18, totalStaked = 1,000e18: APY = (1e18 * 31536000 * 100) / 1000e18 = 3,153,600
     *           - after periodFinish: APY = 0
     */
    function testGetApy_EdgeCasesAndLiveCalculation() public {
        // Case 1: totalStaked = 0 initially (returns 0)
        assertEq(staking.totalStaked(), 0, "totalStaked should be 0");
        assertEq(staking.getApy(30), 0, "getApy should return 0 when totalStaked is 0");

        // Case 2: stake some tokens (1000 WGT)
        vm.startPrank(user);
        token.approve(address(staking), 1000 * 10 ** 18);
        staking.stake(1000 * 10 ** 18, 30);
        vm.stopPrank();

        // rewardRate = POOL / REWARDS_DURATION = 10,000 * 10**18 / 10,000 = 1 * 10**18 / sec.
        // APY = (1e18 * 31536000 * 100) / 1000e18 = 3153600
        assertEq(staking.getApy(30), 3_153_600, "getApy should calculate correct live APY");

        // Case 3: after periodFinish (returns 0)
        vm.warp(block.timestamp + REWARDS_DURATION + 1);
        assertEq(staking.getApy(30), 0, "getApy should return 0 after periodFinish");
    }
}
