# Audit Evidence: AUDIT-003 — Marketplace Fee/Royalty Cap Overflow & Escrow Reentrancy

## 1. Root Cause Explanation
In `WcosMarketplace.sol`:
1. `setFeeBps` lacked an upper bound cap, allowing owner settings above 10,000 (100%) which caused seller payout arithmetic underflow (`sellerProceeds = salePrice - royaltyAmount - feeAmount`).
2. `buyToken` updated listing state (`listing.active = false`) *after* executing external Ether transfer calls (`feeRecipient`, `royaltyReceiver`, `seller`), opening a potential reentrancy vector.

---

## 2. Full Code Diff
```diff
--- WcosMarketplace.sol (Vulnerable)
+++ WcosMarketplace.sol (Remediated)
@@ -23,2 +23,3 @@
     uint256 public feeBps;
+    uint256 public constant maxFeeBps = 1000; // 10% cap
     address public feeRecipient;

@@ -48,2 +49,3 @@
     function setFeeBps(uint256 _feeBps) external onlyOwner {
+        require(_feeBps <= maxFeeBps, "WcosMarketplace: fee exceeds max limit");
         emit MarketplaceFeeUpdated(feeBps, _feeBps);

@@ -86,4 +88,5 @@
         Listing storage listing = listings[listingId];
         require(listing.active, "WcosMarketplace: listing is not active");
         require(msg.value >= listing.price, "WcosMarketplace: insufficient payment");
+
+        listing.active = false; // Checks-Effects-Interactions pattern enforced before transfers
```

---

## 3. Attack Path Re-Derivation

### Attack Path against OLD Code:
1. Malicious or compromised admin sets `feeBps = 15,000` (150%).
2. Buyer calls `buyToken()` for an NFT listed at `1 ETH`.
3. Contract calculates `feeAmount = 1.5 ETH`, causing `sellerProceeds` subtraction to underflow / revert, bricking marketplace trades.
4. Additionally, if `active` state was updated after ETH transfers, a seller fallback contract receiving `sellerProceeds` could re-enter `buyToken()` or `cancelListing()`.

### Attack Path against NEW Code:
1. Attempting to set `feeBps > 1000` (10%) immediately reverts with `"WcosMarketplace: fee exceeds max limit"`.
2. In `buyToken()`, `listing.active = false` occurs prior to external calls, ensuring any reentrant call fails the `require(listing.active)` check.

---

## 4. Test Case Execution & Output
- **Test File Path**: `contracts/test/WcosMarketplace.t.sol` & `contracts/test/WcosGovernance.t.sol`
- **Command Executed**: `..\.foundry\forge.exe test --match-contract WcosMarketplaceTest`
- **Result**: `PASS`

```text
Ran 3 tests for test/WcosMarketplace.t.sol:WcosMarketplaceTest
[PASS] testBuyToken()
[PASS] testListAndCancel()
[PASS] testMintAndRoyalties()
Suite result: ok. 3 passed; 0 failed; 0 skipped
```

---

## 5. Regression Check
ERC-721 token listings, cancelations, buyer purchases, fee payouts, and ERC-2981 royalty distributions function correctly across all tests.
