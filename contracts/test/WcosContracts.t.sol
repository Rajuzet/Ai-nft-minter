// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/WcosMembership.sol";

contract WcosContractsTest is Test {
    WcosMembership public membership;

    address public creator = address(1);
    address public memberA  = address(2);
    address public memberB  = address(3);

    function setUp() public {
        vm.deal(creator, 10 ether);
        vm.deal(memberA,  5 ether);
        vm.deal(memberB,  5 ether);

        vm.prank(creator);
        membership = new WcosMembership(
            "WCOS Creator Club",
            "WCLUB",
            "https://wcos.io/metadata/{id}.json"
        );
    }

    // ── Membership Tests ──────────────────────────────────────────────────────

    function testMintBronze() public {
        vm.prank(memberA);
        membership.mint{value: 0.01 ether}(1, 1); // BRONZE
        assertEq(membership.balanceOf(memberA, 1), 1);
        assertTrue(membership.isMember(memberA));
    }

    function testMintGold() public {
        vm.prank(memberA);
        membership.mint{value: 0.10 ether}(3, 1); // GOLD
        assertEq(membership.highestTier(memberA), 3);
    }

    function testMintInsufficientPayment() public {
        vm.prank(memberA);
        vm.expectRevert("WcosMembership: insufficient payment");
        membership.mint{value: 0.001 ether}(2, 1); // SILVER needs 0.05 ETH
    }

    function testNonMemberCheck() public {
        assertFalse(membership.isMember(memberB));
        assertEq(membership.highestTier(memberB), 0);
    }

    function testOwnerWithdraw() public {
        vm.prank(memberA);
        membership.mint{value: 0.01 ether}(1, 1);

        uint256 balanceBefore = creator.balance;
        vm.prank(creator);
        membership.withdraw();
        assertGt(creator.balance, balanceBefore);
    }
}
