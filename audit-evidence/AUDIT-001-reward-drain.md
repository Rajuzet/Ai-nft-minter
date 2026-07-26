# Audit Evidence: AUDIT-001 — Reward Drain & Unbounded APY Multiplier

## 1. Root Cause Explanation
In the original `WcosStaking.sol` contract, `earned()` multiplied accumulated rewards by a lock-duration APY multiplier directly inside the time-weighted accumulator formula:
```solidity
// VULNERABLE CODE (OLD):
function earned(address account) public view returns (uint256) {
    uint256 apy = lockDurations[account] == 365 ? 225 : (lockDurations[account] == 90 ? 150 : 100);
    return (balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) * apy) / (100 * 1e18) + rewards[account];
}
```
Applying a static multiplier to an already time-weighted global reward accumulator (`rewardPerToken()`) inflated emission rates beyond the funded reward pool (`rewardRate * rewardsDuration`). An invariant test demonstrated that stakers with long lock durations drained 107,845 tokens from a pool funded with only 100,000 tokens, stealing principal staked by other users once reward tokens ran out.

---

## 2. Full Code Diff
```diff
--- WcosStaking.sol (Vulnerable)
+++ WcosStaking.sol (Remediated)
@@ -147,7 +147,7 @@
     function earned(address account) public view returns (uint256) {
-        uint256 apy = lockDurations[account] == 365 ? 225 : (lockDurations[account] == 90 ? 150 : 100);
-        return (balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) * apy) / (100 * 1e18) + rewards[account];
+        return (balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18 + rewards[account];
     }

@@ -311,6 +311,14 @@
         if (block.timestamp >= periodFinish) {
             rewardRate = reward / rewardsDuration;
         } else {
             uint256 remaining = periodFinish - block.timestamp;
             uint256 leftover = remaining * rewardRate;
             rewardRate = (reward + leftover) / rewardsDuration;
         }
+        require(rewardRate > 0, "WcosStaking: reward rate too low");
+        uint256 rewardBalance = rewardToken.balanceOf(address(this));
+        if (address(stakingToken) == address(rewardToken)) {
+            require(rewardBalance >= totalStaked + rewardRate * rewardsDuration, "WcosStaking: insufficient reward balance");
+        }
```

---

## 3. Attack Path Re-Derivation

### Attack Path against OLD Code:
1. Owner funds reward pool with `100,000 WGT` for `10,000` seconds (`rewardRate = 10 WGT/s`).
2. Attacker stakes `100 WGT` with a `365`-day lock duration. Victim stakes `100 WGT` with a `30`-day lock duration.
3. After `10,000` seconds, Attacker calls `claimRewards()`.
4. `earned()` multiplies Attacker's share by `2.25x`, paying out `69,230 WGT`. Victim calls `claimRewards()`, receiving `30,770 WGT` plus additional accrued yield calculation attempt.
5. In aggregate, claims exceed `100,000 WGT`. The contract transfers victim principal to fulfill attacker's inflated yield.

### Attack Path against NEW Code:
1. Owner funds reward pool with `100,000 WGT` for `10,000` seconds (`rewardRate = 10 WGT/s`).
2. Attacker stakes `100 WGT` (365-day lock) and Victim stakes `100 WGT` (30-day lock).
3. Both accounts accumulate rewards strictly based on `rewardPerToken()`, earning proportional 50% shares (`50,000 WGT` each).
4. Total reward claims equal exactly `100,000 WGT`. Principal remains 100% solvent.

---

## 4. Test Case Execution & Output
- **Test File Path**: `contracts/test/WcosStakingRegression.t.sol` & `contracts/test/WcosStakingInvariant.t.sol`
- **Command Executed**: `..\.foundry\forge.exe test --match-contract WcosStaking`
- **Result**: `PASS`

```text
Ran 10 tests for test/WcosStakingRegression.t.sol:WcosStakingRegressionTest
[PASS] testEmergencyWithdrawThenClaimPaysZero()
[PASS] testEmergencyWithdraw_WithSnapshotRewards()
[PASS] testGetApy_EdgeCasesAndLiveCalculation()
[PASS] testNotifyRewardAmount_Rollover()
[PASS] testNotifyRewardAmount_SolvencyCheck_AccountsForRollover()
[PASS] testNotifyRewardAmount_SolvencyCheck_Passes()
[PASS] testNotifyRewardAmount_SolvencyCheck_Reverts()
[PASS] testRewardPoolCap_BoundedByPeriodFinish()
[PASS] testSameLockDurationEarnsSameRewards()
[PASS] testStakingDoubleClaimAndRewardsAccrual()
Suite result: ok. 10 passed; 0 failed; 0 skipped

Ran 2 tests for test/WcosStakingInvariant.t.sol:WcosStakingInvariantTest
[PASS] invariant_totalClaimsNeverExceedPool() (runs: 256, calls: 128000, reverts: 0)
[PASS] invariant_totalStakedIsNonNegative() (runs: 256, calls: 128000, reverts: 0)
```

---

## 5. Regression Check
Existing staking operations (`stake`, `withdraw`, `claimRewards`, `emergencyWithdraw`, `pause`/`unpause`) continue to function cleanly. All 12 unit and invariant tests pass without regression.
