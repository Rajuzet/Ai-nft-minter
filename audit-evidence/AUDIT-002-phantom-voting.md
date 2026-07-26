# Audit Evidence: AUDIT-002 — Phantom Voting & Voting Weight Flash Transfer

## 1. Root Cause Explanation
In `WcosGovernor.sol`, the vote weight resolution previously fell back to current token balance (`balanceOf`) if `getPastVotes()` returned 0:
```solidity
// VULNERABLE CODE (OLD):
uint256 weight = token.getPastVotes(msg.sender, snapshotBlock);
if (weight == 0) {
    weight = token.balanceOf(msg.sender); // VULNERABLE FALLBACK
}
```
Additionally, `WcosGovernanceToken.sol` required explicit calls to `delegate()` to record checkpoints. Because balance fallback bypassed the historical snapshot block requirement, an attacker could transfer tokens *after* a proposal was created to a fresh wallet, allowing the fresh wallet to cast votes on an old proposal using newly acquired tokens.

---

## 2. Full Code Diff
```diff
--- WcosGovernor.sol (Vulnerable)
+++ WcosGovernor.sol (Remediated)
@@ -94,5 +94,3 @@
         uint256 snapshotBlock = proposal.startBlock > 0 ? proposal.startBlock - 1 : 0;
         uint256 weight = token.getPastVotes(msg.sender, snapshotBlock);
-        if (weight == 0) {
-            weight = token.balanceOf(msg.sender);
-        }
         require(weight > 0, "WcosGovernor: no voting weight");

--- WcosGovernanceToken.sol (Vulnerable)
+++ WcosGovernanceToken.sol (Remediated)
@@ -60,4 +60,7 @@
     function mint(address to, uint256 amount) external onlyOwner {
         _mint(to, amount);
+        if (delegates[to] == address(0)) {
+            _delegate(to, to);
+        }
     }
```

---

## 3. Attack Path Re-Derivation

### Attack Path against OLD Code:
1. Proposal X is created at Block 100 (`snapshotBlock = 99`).
2. Attacker holds `100,000 WGT` at Block 99 and votes "YES" on Proposal X using their checkpointed votes.
3. At Block 105, Attacker transfers `100,000 WGT` to Sybil Wallet B.
4. Sybil Wallet B calls `castVote(Proposal X, YES)`.
5. Because Sybil Wallet B had 0 checkpointed votes at Block 99, `getPastVotes()` returned 0.
6. The vulnerable code executed `weight = token.balanceOf(msg.sender)`, returning `100,000 WGT`.
7. Sybil Wallet B successfully cast a second `100,000` votes on Proposal X, doubling voting power from the same underlying tokens.

### Attack Path against NEW Code:
1. Proposal X is created at Block 100 (`snapshotBlock = 99`).
2. Attacker votes at Block 102.
3. Attacker transfers `100,000 WGT` to Sybil Wallet B at Block 105.
4. Sybil Wallet B calls `castVote(Proposal X)`.
5. `getPastVotes(Sybil Wallet B, 99)` returns `0`.
6. Transaction reverts with `"WcosGovernor: no voting weight"`. Exploit blocked.

---

## 4. Test Case Execution & Output
- **Test File Path**: `contracts/test/WcosGovernanceTokenRegression.t.sol`
- **Command Executed**: `..\.foundry\forge.exe test --match-contract WcosGovernanceTokenRegressionTest`
- **Result**: `PASS`

```text
Ran 6 tests for test/WcosGovernanceTokenRegression.t.sol:WcosGovernanceTokenRegressionTest
[PASS] testCheckpointTransfer()
[PASS] testDoubleVotingPowerPrevention()
[PASS] testMintAutoDelegate_ThenTransfer_CheckpointDropsToZero()
[PASS] testMintAutoSelfDelegate()
[PASS] testMintAutoSelfDelegate_Idempotent()
[PASS] testNonDelegatorGetsZeroVotingWeight()
Suite result: ok. 6 passed; 0 failed; 0 skipped
```

---

## 5. Regression Check
Legitimate token holders who delegate their votes can seamlessly propose, cast votes, and queue proposals. All governance lifecycle tests pass cleanly.
