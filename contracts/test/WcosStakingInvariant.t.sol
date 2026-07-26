// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "forge-std/StdInvariant.sol";
import "../src/WcosGovernanceToken.sol";
import "../src/WcosStaking.sol";

// ── Fuzz test (stateless) ──────────────────────────────────────────────────

/**
 * @title WcosStakingFuzzTest
 * @notice Stateless fuzz test: randomises staker count, amount, and elapsed
 *         time and asserts that total rewards claimed never exceed the funded
 *         reward budget (rewardRate × rewardsDuration).
 *
 *         This test caught the original invariant failure caused by the
 *         absence of a periodFinish cap — with an unbounded lastTimeRewardApplicable()
 *         a single staker who waited long enough could claim > 100 000 WGT
 *         (the initial pool) by pulling from staked principal of other users.
 *
 *         Run with: forge test --match-contract WcosStakingFuzzTest --fuzz-runs 256 -vvv
 */
contract WcosStakingFuzzTest is Test {
    WcosGovernanceToken token;
    WcosStaking staking;

    address owner = address(0xAA00);

    uint256 constant POOL             = 100_000 * 1e18;
    uint256 constant REWARDS_DURATION = 365 days; // rewardRate = POOL / 365d ≈ 3.17e12 /s

    // Maximum claimable = rewardRate × rewardsDuration ≤ POOL (integer division)
    uint256 rewardBudget; // set in setUp after notifyRewardAmount

    function setUp() public {
        vm.startPrank(owner);
        token = new WcosGovernanceToken("WGT", "WGT", 10_000_000 * 1e18);
        staking = new WcosStaking(address(token), address(token), REWARDS_DURATION);

        token.transfer(address(staking), POOL);
        staking.notifyRewardAmount(POOL);
        // rewardBudget = rewardRate × rewardsDuration (≤ POOL due to integer truncation)
        rewardBudget = staking.rewardRate() * REWARDS_DURATION;
        vm.stopPrank();
    }

    /**
     * @notice Fuzz over: number of users (1-5), stake amount, lock duration,
     *         and elapsed time before claim.
     *
     *         KEY INVARIANT: sum of all claimed rewards ≤ rewardBudget
     */
    function testFuzz_totalClaimsNeverExceedPool(
        uint8 numUsers,
        uint128[5] calldata rawAmounts,
        uint8[5] calldata rawDurations,
        uint40 elapsed
    ) public {
        numUsers = uint8(bound(numUsers, 1, 5));
        elapsed  = uint40(bound(elapsed, 1, 2 * REWARDS_DURATION)); // allow past periodFinish

        uint256[3] memory validDurations = [uint256(30), uint256(90), uint256(365)];

        address[] memory users = new address[](numUsers);
        uint256 totalClaimed;

        for (uint8 i = 0; i < numUsers; i++) {
            users[i] = address(uint160(0x1000 + i));
            uint256 amount = bound(rawAmounts[i], 1e18, 10_000 * 1e18);
            uint256 lockDuration = validDurations[rawDurations[i] % 3];

            vm.prank(owner);
            token.transfer(users[i], amount);

            vm.startPrank(users[i]);
            token.approve(address(staking), amount);
            staking.stake(amount, lockDuration);
            vm.stopPrank();
        }

        vm.warp(block.timestamp + elapsed);

        for (uint8 i = 0; i < numUsers; i++) {
            if (staking.earned(users[i]) == 0) continue;
            uint256 before = token.balanceOf(users[i]);
            vm.prank(users[i]);
            try staking.claimRewards() {} catch {}
            totalClaimed += token.balanceOf(users[i]) - before;
        }

        // KEY INVARIANT: total tokens paid out ≤ funded reward budget
        assertLe(totalClaimed, rewardBudget,
            "INVARIANT BROKEN: sum(claims) > rewardRate * rewardsDuration");
    }

    /**
     * @notice Directed case: single staker warps 2× past periodFinish.
     *         Earned must be capped at rewardBudget, not grow unboundedly.
     */
    function testDirected_poolCannotBeOverdrained() public {
        address alice = address(0xA1CE);

        vm.prank(owner);
        token.transfer(alice, 1_000 * 1e18);

        vm.startPrank(alice);
        token.approve(address(staking), 1_000 * 1e18);
        staking.stake(1_000 * 1e18, 30);
        vm.stopPrank();

        // Warp 2× past periodFinish
        vm.warp(block.timestamp + 2 * REWARDS_DURATION);

        uint256 pending = staking.earned(alice);
        assertLe(pending, rewardBudget,
            "earned must be capped at rewardBudget after periodFinish");
        assertEq(staking.totalStaked(), 1_000 * 1e18, "totalStaked must be unchanged");
    }
}

// ── Stateful invariant test ───────────────────────────────────────────────

/**
 * @title WcosStakingHandler
 * @notice Forge invariant handler driving staking state with bounded random calls.
 */
contract WcosStakingHandler is Test {
    WcosGovernanceToken public token;
    WcosStaking public staking;
    address public owner;

    address[4] public actors = [
        address(0xA001),
        address(0xA002),
        address(0xA003),
        address(0xA004)
    ];

    // Cumulative tokens received as rewards (excludes principal returns)
    uint256 public totalClaimedGlobal;

    // Track each actor's balance before so we can diff on claim
    mapping(address => uint256) private _balanceBefore;

    constructor(WcosGovernanceToken _token, WcosStaking _staking, address _owner) {
        token = _token;
        staking = _staking;
        owner = _owner;
    }

    function stake(uint256 actorSeed, uint256 amount, uint8 durationSeed) external {
        address actor = actors[actorSeed % 4];
        amount = bound(amount, 1e18, 5_000 * 1e18);
        uint256[3] memory durations = [uint256(30), uint256(90), uint256(365)];
        uint256 duration = durations[durationSeed % 3];

        vm.prank(owner);
        token.transfer(actor, amount);

        vm.startPrank(actor);
        token.approve(address(staking), amount);
        try staking.stake(amount, duration) {} catch {}
        vm.stopPrank();
    }

    function claim(uint256 actorSeed) external {
        address actor = actors[actorSeed % 4];
        uint256 before = token.balanceOf(actor);
        vm.prank(actor);
        try staking.claimRewards() {} catch {}
        uint256 received = token.balanceOf(actor) - before;
        totalClaimedGlobal += received;
    }

    function warpTime(uint256 seconds_) external {
        // Cap warp to 2× rewardsDuration so the fuzzer explores both within and past periodFinish
        vm.warp(block.timestamp + bound(seconds_, 1, 2 * staking.rewardsDuration()));
    }

    function emergencyExit(uint256 actorSeed) external {
        address actor = actors[actorSeed % 4];
        vm.prank(actor);
        try staking.emergencyWithdraw() {} catch {}
    }
}

/**
 * @title WcosStakingInvariantTest
 * @notice Stateful Forge invariant test.
 *
 *         After any sequence of stake / claim / warpTime / emergencyExit calls:
 *
 *         INVARIANT 1: totalClaimedGlobal ≤ rewardRate × rewardsDuration
 *           The periodFinish cap ensures rewards never exceed the funded budget.
 *
 *         INVARIANT 2: totalStaked ≤ token.totalSupply()
 *           Sanity check — totalStaked can never exceed token supply.
 *
 *         Run with: forge test --match-contract WcosStakingInvariantTest -vvv
 */
contract WcosStakingInvariantTest is Test {
    WcosGovernanceToken token;
    WcosStaking staking;
    WcosStakingHandler handler;

    address owner = address(0xAA00);

    uint256 constant POOL             = 100_000 * 1e18;
    uint256 constant REWARDS_DURATION = 365 days;

    // Maximum claimable across all stakers for the funded period
    uint256 rewardBudget;

    function setUp() public {
        vm.startPrank(owner);
        token = new WcosGovernanceToken("WGT", "WGT", 10_000_000 * 1e18);
        staking = new WcosStaking(address(token), address(token), REWARDS_DURATION);

        token.transfer(address(staking), POOL);
        staking.notifyRewardAmount(POOL);
        rewardBudget = staking.rewardRate() * REWARDS_DURATION;
        vm.stopPrank();

        handler = new WcosStakingHandler(token, staking, owner);
        targetContract(address(handler));
    }

    /// @notice Core safety invariant: cumulative claimed tokens ≤ funded reward budget.
    function invariant_totalClaimsNeverExceedPool() public view {
        assertLe(
            handler.totalClaimedGlobal(),
            rewardBudget,
            "INVARIANT BROKEN: cumulative claims exceed funded reward budget"
        );
    }

    /// @notice totalStaked must never exceed token supply (sanity / underflow guard).
    function invariant_totalStakedIsNonNegative() public view {
        assertLe(staking.totalStaked(), token.totalSupply());
    }
}
