// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title WcosStaking
 * @notice Synthetix-style time-weighted staking contract with bounded reward periods.
 *
 * REWARD MECHANICS
 * ────────────────
 * The owner funds a reward period by calling notifyRewardAmount(reward).
 * This sets rewardRate = reward / rewardsDuration and a new periodFinish.
 *
 * rewardPerToken() tracks cumulative reward tokens earned per staked token
 * since the last update, capped at periodFinish so the pool can never be
 * over-distributed:
 *
 *   rewardPerToken += (elapsed_seconds × rewardRate × 1e18) / totalStaked
 *
 * where elapsed_seconds = min(block.timestamp, periodFinish) - lastUpdateTime.
 *
 * Each user's pending reward at any moment is:
 *
 *   earned(account) = balances[account]
 *                     × (rewardPerToken() − userRewardPerTokenPaid[account])
 *                     / 1e18
 *                   + rewards[account]   ← already-snapshotted amount
 *
 * TOTAL REWARDS INVARIANT
 * ───────────────────────
 * Maximum cumulative claimable across ALL stakers:
 *   = rewardRate × rewardsDuration
 *   ≤ reward passed to notifyRewardAmount()   (due to integer division truncation)
 *
 * This bound holds even when stakingToken == rewardToken, because
 * lastTimeRewardApplicable() never exceeds periodFinish.
 *
 * APY TIERS (informational only)
 * ───────────────────────────────
 * getApy() returns a percentage label used by the frontend UI and the
 * backend's on-chain APY read (defi.service.ts). It does NOT affect token
 * distribution — that is solely determined by rewardRate and elapsed time.
 * Differentiated rewards by lock duration require per-user rewardRate
 * snapshots (planned future work).
 *
 * EMERGENCY WITHDRAW
 * ───────────────────
 * emergencyWithdraw() follows Checks-Effects-Interactions strictly:
 *   1. All storage is zeroed (balances, totalStaked, rewards, timers,
 *      userRewardPerTokenPaid — synced so claimRewards returns 0 after).
 *   2. External token transfer is called last.
 * Any rewards that accrued since the last checkpoint are permanently
 * forfeited — this is intentional: emergency withdraw is a last-resort
 * escape hatch, not a reward claim.
 */
contract WcosStaking is ReentrancyGuard, Ownable2Step, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    IERC20 public rewardToken;

    // ── Reward period state ───────────────────────────────────────────────
    uint256 public rewardRate;          // reward tokens emitted per second across all stakers
    uint256 public rewardsDuration;     // length of each funded reward period (seconds)
    uint256 public periodFinish;        // timestamp at which current period ends (reward accrual stops)
    uint256 public lastUpdateTime;      // last time rewardPerTokenStored was updated
    uint256 public rewardPerTokenStored;
    uint256 public totalStaked;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public balances;

    // Time lock variables
    mapping(address => uint256) public unlockTimes;
    mapping(address => uint256) public stakeTimes;
    mapping(address => uint256) public lockDurations;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardAdded(uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);

    /**
     * @dev Snapshots the global rewardPerToken and the caller's pending
     *      reward before any state-changing operation. This is the standard
     *      Synthetix guard that prevents double-claiming.
     */
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    /**
     * @param _stakingToken  Token users stake.
     * @param _rewardToken   Token distributed as rewards (may equal _stakingToken).
     * @param _rewardsDuration Length of each reward period in seconds. Cannot be 0.
     */
    constructor(address _stakingToken, address _rewardToken, uint256 _rewardsDuration) {
        require(_rewardsDuration > 0, "WcosStaking: rewardsDuration cannot be 0");
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardsDuration = _rewardsDuration;
        lastUpdateTime = block.timestamp;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @notice Returns the lesser of the current timestamp and periodFinish.
     * @dev    This cap is the critical safety mechanism that prevents rewards
     *         from accruing beyond the funded period.  Without it, stakers
     *         could earn infinite rewards against a finite pool.
     */
    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    /**
     * @notice Cumulative reward tokens earned per staked token (scaled ×1e18).
     * @dev    Pure Synthetix formula — no per-tier multiplier.  The APY
     *         percentage labels in getApy() are informational only.
     *         Accrual stops at periodFinish (via lastTimeRewardApplicable).
     */
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            (((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18) / totalStaked);
    }

    /**
     * @notice Calculates the live APY percentage based on the active rewardRate and totalStaked.
     * @dev    This is purely informational and represents the current annualized yield rate
     *         of the entire staking pool. It does NOT affect the actual distribution of rewards
     *         (which is strictly determined by rewardRate and elapsed time in earned()).
     *         It is computed as: (rewardRate * 31,536,000 * 100) / totalStaked.
     *         If totalStaked is 0 or no reward period is active, it returns 0.
     *         
     *         The `lockDuration` parameter is retained for backward-compatibility with
     *         existing calls but does not affect the calculation as all tiers earn the same rate.
     * @return The annualized reward rate percentage (scaled by 1, e.g. 15 for 15% APY).
     */
    function getApy(uint256 /*lockDuration*/) public view returns (uint256) {
        if (totalStaked == 0 || block.timestamp >= periodFinish) {
            return 0;
        }
        // rewardRate is tokens/sec. 1 year = 31,536,000 seconds.
        // rewardRate * 31,536,000 * 100 / totalStaked
        return (rewardRate * 31536000 * 100) / totalStaked;
    }

    /**
     * @notice Pending reward for `account`.
     *
     * TIER / APY DECISION — PATH (A): TIERING INTENTIONALLY DROPPED
     * ──────────────────────────────────────────────────────────────
     * The previous earned() formula applied a lock-duration multiplier:
     *   balance × (rewardPerToken() − userRewardPerTokenPaid) × apy / (8 × 1e18)
     * This multiplied an already time-weighted accumulator by 1×/1.5×/2.25×,
     * allowing 365-day stakers to drain the pool at 2.25× the funded emission
     * rate.  An invariant fuzzer proved this: 107,845 WGT was claimed against
     * a 100,000 WGT pool (the excess came from staked principal of other users).
     *
     * PATH (A) was chosen for the following reasons:
     *   1. Implementing differentiated rates CORRECTLY requires per-user
     *      rewardRate snapshots stored at stake time — a significant redesign
     *      of the single-pool Synthetix architecture used here.
     *   2. Applying the multiplier INSIDE earned() to an already time-weighted
     *      accumulator is mathematically incorrect and cannot be made safe
     *      without either separate pools or per-user rate accounting.
     *   3. Lock durations still serve a product purpose: they provide the
     *      protocol with guaranteed liquidity commitments.  Different lock
     *      lengths can be presented with informational APY labels (getApy())
     *      and the owner can set a higher rewardRate for longer-lock periods
     *      in future via governance-controlled notifyRewardAmount() calls.
     *   4. The frontend staking page has been updated to show lock-duration
     *      options WITHOUT advertising differentiated APY yields (the labels
     *      no longer claim "8% APY / 12% APY / 18% APY" for each tier).
     *
     * The standard Synthetix formula used here guarantees:
     *   sum(earned(all users)) ≤ rewardRate × rewardsDuration
     *                          ≤ amount passed to notifyRewardAmount()
     *
     * ROLLOVER
     * ────────
     * notifyRewardAmount() implements the Synthetix mid-period rollover:
     *   if (block.timestamp >= periodFinish)
     *       rewardRate = reward / rewardsDuration;
     *   else
     *       rewardRate = (reward + remaining * oldRate) / rewardsDuration;
     * so undistributed tokens from a previous period are never lost.
     *
     * SOLVENCY CHECK
     * ──────────────
     * After computing the new rewardRate, notifyRewardAmount() requires:
     *   rewardToken.balanceOf(address(this)) ≥ totalStaked + rewardRate × rewardsDuration
     *   (when stakingToken == rewardToken; the totalStaked term isolates the reward pool)
     * This prevents the owner from setting a rate the contract cannot pay.
     */
    function earned(address account) public view returns (uint256) {
        return
            (balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) /
            1e18 +
            rewards[account];
    }

    // ── Staking ───────────────────────────────────────────────────────────

    function stake(uint256 amount) external whenNotPaused nonReentrant updateReward(msg.sender) {
        _stake(msg.sender, amount, 30);
    }

    function stake(uint256 amount, uint256 lockDuration) external whenNotPaused nonReentrant updateReward(msg.sender) {
        require(lockDuration == 30 || lockDuration == 90 || lockDuration == 365, "WcosStaking: invalid lock duration");
        _stake(msg.sender, amount, lockDuration);
    }

    function _stake(address user, uint256 amount, uint256 lockDuration) internal {
        require(amount > 0, "WcosStaking: cannot stake 0");

        balances[user] += amount;
        totalStaked += amount;
        stakeTimes[user] = block.timestamp;
        lockDurations[user] = lockDuration;
        unlockTimes[user] = block.timestamp + (lockDuration * 1 days);

        stakingToken.safeTransferFrom(user, address(this), amount);
        emit Staked(user, amount);
    }

    function withdraw(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "WcosStaking: cannot withdraw 0");
        require(balances[msg.sender] >= amount, "WcosStaking: insufficient staked balance");
        require(block.timestamp >= unlockTimes[msg.sender], "WcosStaking: tokens are locked");

        balances[msg.sender] -= amount;
        totalStaked -= amount;
        stakeTimes[msg.sender] = block.timestamp;

        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function claimRewards() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "WcosStaking: no rewards to claim");

        rewards[msg.sender] = 0;
        stakeTimes[msg.sender] = block.timestamp;

        rewardToken.safeTransfer(msg.sender, reward);
        emit RewardPaid(msg.sender, reward);
    }

    /**
     * @notice Emergency escape hatch — withdraws principal, forfeiting all
     *         pending rewards.
     * @dev    Follows Checks-Effects-Interactions strictly.
     *         userRewardPerTokenPaid is synced to the current rewardPerToken()
     *         so that any subsequent claimRewards() call correctly returns 0.
     */
    function emergencyWithdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "WcosStaking: no stake to withdraw");

        // Effects — all storage zeroed before any external call
        balances[msg.sender] = 0;
        totalStaked -= amount;
        rewards[msg.sender] = 0;
        userRewardPerTokenPaid[msg.sender] = rewardPerToken(); // sync so claimRewards() returns 0
        stakeTimes[msg.sender] = 0;
        unlockTimes[msg.sender] = 0;
        lockDurations[msg.sender] = 0;

        // Interaction
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    // ── Owner: reward management ──────────────────────────────────────────

    /**
     * @notice Fund a new reward period.
     * @dev    Caller must have already transferred `reward` tokens to this
     *         contract (or the safety check at the end will revert).
     *
     *         If called mid-period, the remaining undistributed tokens from
     *         the current period are rolled into the new rate calculation so
     *         no rewards are lost.
     *
     *         INVARIANT: after this call,
     *           rewardRate × rewardsDuration ≤ rewardToken.balanceOf(address(this))
     *           (accounting for staked principal when stakingToken == rewardToken)
     */
    function notifyRewardAmount(uint256 reward) external onlyOwner updateReward(address(0)) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward / rewardsDuration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / rewardsDuration;
        }

        require(rewardRate > 0, "WcosStaking: reward rate too low");

        // Safety: contract must hold enough reward tokens to cover the full new period.
        // When stakingToken == rewardToken the balance also includes staked principal,
        // so subtract totalStaked to isolate the actual reward pool.
        uint256 rewardBalance = rewardToken.balanceOf(address(this));
        if (address(stakingToken) == address(rewardToken)) {
            require(rewardBalance >= totalStaked + rewardRate * rewardsDuration,
                "WcosStaking: insufficient reward balance");
        } else {
            require(rewardBalance >= rewardRate * rewardsDuration,
                "WcosStaking: insufficient reward balance");
        }

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        emit RewardAdded(reward);
    }

    /**
     * @notice Update the reward period duration.
     * @dev    Can only be called when no active period is running to avoid
     *         disrupting in-flight reward distributions.
     */
    function setRewardsDuration(uint256 _rewardsDuration) external onlyOwner {
        require(block.timestamp > periodFinish, "WcosStaking: reward period active");
        require(_rewardsDuration > 0, "WcosStaking: duration cannot be 0");
        rewardsDuration = _rewardsDuration;
        emit RewardsDurationUpdated(_rewardsDuration);
    }
}
