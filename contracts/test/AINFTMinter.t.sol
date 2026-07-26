// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/AINFTMinter.sol";

contract AINFTMinterTest is Test {
    AINFTMinter public minter;
    address public owner = address(1);
    address public user = address(2);

    bytes32 public testHash;

    uint8 public tierBasic;
    uint8 public tierStandard;
    uint8 public tierFull;

    function setUp() public {
        vm.deal(user, 10 ether);
        vm.prank(owner);
        // Initialize AINFTMinter with a max supply of 5
        minter = new AINFTMinter(5);

        tierBasic = minter.TIER_BASIC();
        tierStandard = minter.TIER_STANDARD();
        tierFull = minter.TIER_FULL();

        testHash = sha256("test-asset-bytes");
    }

    /**
     * @notice (a) Minting with tier=Full and insufficient payment reverts.
     *         Expected: TIER_FULL price is 0.02 ether. Paying 0.019 ether must revert.
     */
    function testMintFullInsufficientPaymentReverts() public {
        vm.startPrank(user);
        vm.expectRevert("AINFTMinter: incorrect mint fee");
        minter.mintAINFT{value: 0.019 ether}(user, "ipfs://test-uri", tierFull, testHash);
        vm.stopPrank();
    }

    /**
     * @notice (b) Tier=Full correctly stores and verifyContent() correctly validates/rejects tampered bytes.
     *         Expected:
     *           - TIER_FULL price is 0.02 ether.
     *           - contentHash[tokenId] = TEST_HASH
     *           - verifyContent(tokenId, "test-asset-bytes") = true
     *           - verifyContent(tokenId, "tampered-bytes") = false
     */
    function testMintFullStoresHashAndVerifiesContent() public {
        vm.startPrank(user);
        uint256 tokenId = minter.mintAINFT{value: 0.02 ether}(user, "ipfs://test-uri", tierFull, testHash);
        vm.stopPrank();

        // Verify stored hash matches
        assertEq(minter.contentHash(tokenId), testHash, "content hash mismatch");

        // Verify content validation with correct bytes
        bytes memory correctBytes = "test-asset-bytes";
        assertTrue(minter.verifyContent(tokenId, correctBytes), "should verify correct bytes");

        // Verify content validation fails with incorrect bytes
        bytes memory tamperedBytes = "tampered-bytes";
        assertFalse(minter.verifyContent(tokenId, tamperedBytes), "should reject tampered bytes");
    }

    /**
     * @notice (c) Tier=Standard does NOT write to contract storage (check storage slot is untouched).
     *         Expected:
     *           - TIER_STANDARD price is 0.01 ether.
     *           - contentHash[tokenId] = bytes32(0)
     */
    function testMintStandardDoesNotWriteToStorage() public {
        vm.startPrank(user);
        uint256 tokenId = minter.mintAINFT{value: 0.01 ether}(user, "ipfs://test-uri", tierStandard, testHash);
        vm.stopPrank();

        // Verify storage is untouched (bytes32(0))
        assertEq(minter.contentHash(tokenId), bytes32(0), "standard tier should not write to storage");
        assertFalse(minter.verifyContent(tokenId, "test-asset-bytes"), "standard tier should not support on-chain verification");
    }

    /**
     * @notice (d) Tier=Basic requires no contentHash param (can be bytes32(0)) and costs the base mint fee only.
     *         Expected:
     *           - TIER_BASIC price is 0.005 ether.
     *           - contentHash[tokenId] = bytes32(0)
     */
    function testMintBasicOnlyCostsBaseFee() public {
        vm.startPrank(user);
        uint256 tokenId = minter.mintAINFT{value: 0.005 ether}(user, "ipfs://test-uri", tierBasic, bytes32(0));
        vm.stopPrank();

        // Verify storage is untouched (bytes32(0))
        assertEq(minter.contentHash(tokenId), bytes32(0), "basic tier should not write to storage");
    }

    /**
     * @notice (e) A user cannot pay the Basic price and claim a Full-tier verification result.
     *         Expected:
     *           - Pay TIER_BASIC price (0.005 ether) but pass TIER_FULL parameter -> reverts due to fee mismatch.
     *           - Pay TIER_BASIC price (0.005 ether), pass TIER_BASIC parameter but supply TEST_HASH ->
     *             tokenId is minted as BASIC tier, contentHash is NOT stored, verifyContent returns false.
     */
    function testUserCannotPayBasicForFullTierVerification() public {
        vm.startPrank(user);
        
        // Paying basic fee for full tier parameter reverts
        vm.expectRevert("AINFTMinter: incorrect mint fee");
        minter.mintAINFT{value: 0.005 ether}(user, "ipfs://test-uri", tierFull, testHash);

        // Paying basic fee for basic tier parameter with a hash parameter does NOT store hash on-chain
        uint256 tokenId = minter.mintAINFT{value: 0.005 ether}(user, "ipfs://test-uri", tierBasic, testHash);
        vm.stopPrank();

        assertEq(minter.contentHash(tokenId), bytes32(0), "basic tier must not store hash");
        assertFalse(minter.verifyContent(tokenId, "test-asset-bytes"), "verifyContent must return false for basic tier");
    }

    /**
     * @notice Verify max supply cap.
     *         Expected: Max supply is 5. Minting 6th token reverts.
     */
    function testMaxSupplyReachedReverts() public {
        vm.startPrank(user);
        for (uint256 i = 0; i < 5; i++) {
            minter.mintAINFT{value: 0.005 ether}(user, "ipfs://test-uri", tierBasic, bytes32(0));
        }

        vm.expectRevert("AINFTMinter: max supply reached");
        minter.mintAINFT{value: 0.005 ether}(user, "ipfs://test-uri", tierBasic, bytes32(0));
        vm.stopPrank();
    }
}
