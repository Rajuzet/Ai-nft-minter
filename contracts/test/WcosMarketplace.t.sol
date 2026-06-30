// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/WcosNFTCollection.sol";
import "../src/WcosMarketplace.sol";

contract WcosMarketplaceTest is Test {
    WcosMarketplace public marketplace;
    WcosNFTCollection public collection;

    address public owner = address(1);
    address public creator = address(2);
    address public buyer = address(3);
    address public royaltyReceiver = address(4);

    function setUp() public {
        vm.deal(owner, 100 ether);
        vm.deal(buyer, 100 ether);
        vm.deal(creator, 100 ether);

        vm.startPrank(owner);
        marketplace = new WcosMarketplace();
        collection = new WcosNFTCollection("Test NFT", "TNFT", 100, 500, royaltyReceiver); // 500 = 5% royalty
        vm.stopPrank();
    }

    function testMintAndRoyalties() public {
        vm.startPrank(owner);
        uint256 tokenId = collection.mintToken(owner, "ipfs://test-uri");
        assertEq(collection.ownerOf(tokenId), owner);

        (address receiver, uint256 royaltyAmount) = collection.royaltyInfo(tokenId, 1 ether);
        assertEq(receiver, royaltyReceiver);
        assertEq(royaltyAmount, 0.05 ether); // 5% of 1 ether
        vm.stopPrank();
    }

    function testListAndCancel() public {
        vm.startPrank(owner);
        uint256 tokenId = collection.mintToken(owner, "ipfs://test-uri");

        // Approve marketplace to transfer token
        collection.approve(address(marketplace), tokenId);

        // List token
        marketplace.listToken(address(collection), tokenId, 1 ether);

        // Verify listing details
        (address seller, uint256 price, bool active) = marketplace.listings(address(collection), tokenId);
        assertEq(seller, owner);
        assertEq(price, 1 ether);
        assertTrue(active);

        // Verify token in escrow
        assertEq(collection.ownerOf(tokenId), address(marketplace));

        // Cancel listing
        marketplace.cancelListing(address(collection), tokenId);

        // Verify token returned
        assertEq(collection.ownerOf(tokenId), owner);
        (, , active) = marketplace.listings(address(collection), tokenId);
        assertFalse(active);
        vm.stopPrank();
    }

    function testBuyToken() public {
        vm.startPrank(owner);
        uint256 tokenId = collection.mintToken(owner, "ipfs://test-uri");
        collection.approve(address(marketplace), tokenId);
        marketplace.listToken(address(collection), tokenId, 1 ether);
        vm.stopPrank();

        // Check balances before
        uint256 ownerBalanceBefore = owner.balance;
        uint256 receiverBalanceBefore = royaltyReceiver.balance;

        // Buy token as buyer
        vm.startPrank(buyer);
        marketplace.buyToken{value: 1 ether}(address(collection), tokenId);
        vm.stopPrank();

        // Verify ownership
        assertEq(collection.ownerOf(tokenId), buyer);

        // Verify proceeds (95% to owner)
        assertEq(owner.balance - ownerBalanceBefore, 0.95 ether);

        // Verify royalties (5% to royaltyReceiver)
        assertEq(royaltyReceiver.balance - receiverBalanceBefore, 0.05 ether);
    }
}
