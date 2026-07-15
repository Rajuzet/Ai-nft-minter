// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract WcosStaking is ReentrancyGuard, Ownable2Step, Pausable {
    using SafeERC20 for IERC20;
    
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    uint256 public rewardRate; // base reward rate
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

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

    constructor(address _stakingToken, address _rewardToken, uint256 _rewardRate) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function rewardPerToken() public view returns (uint256) {
        return rewardPerTokenStored;
    }

    function getApy(uint256 lockDuration) public pure returns (uint256) {
        if (lockDuration == 30) return 8; // 8% APY
        if (lockDuration == 90) return 12; // 12% APY
        if (lockDuration == 365) return 18; // 18% APY
        return 8; // default
    }

    function earned(address account) public view returns (uint256) {
        if (balances[account] == 0) return 0;
        uint256 timeElapsed = block.timestamp - stakeTimes[account];
        uint256 apy = getApy(lockDurations[account]);
        // Linear staking yield formula: balances * apy * timeElapsed / (365 days * 100)
        uint256 yield = (balances[account] * apy * timeElapsed) / (365 days * 100);
        return yield + rewards[account];
    }

    function stake(uint256 amount) external whenNotPaused nonReentrant {
        _stake(msg.sender, amount, 30);
    }

    function stake(uint256 amount, uint256 lockDuration) external whenNotPaused nonReentrant {
        require(lockDuration == 30 || lockDuration == 90 || lockDuration == 365, "WcosStaking: invalid lock duration");
        _stake(msg.sender, amount, lockDuration);
    }

    function _stake(address user, uint256 amount, uint256 lockDuration) internal {
        require(amount > 0, "WcosStaking: cannot stake 0");
        
        rewards[user] = earned(user);
        balances[user] += amount;
        stakeTimes[user] = block.timestamp;
        lockDurations[user] = lockDuration;
        unlockTimes[user] = block.timestamp + (lockDuration * 1 days);
        
        stakingToken.safeTransferFrom(user, address(this), amount);
        
        emit Staked(user, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "WcosStaking: cannot withdraw 0");
        require(balances[msg.sender] >= amount, "WcosStaking: insufficient staked balance");
        require(block.timestamp >= unlockTimes[msg.sender], "WcosStaking: tokens are locked");

        rewards[msg.sender] = earned(msg.sender);
        balances[msg.sender] -= amount;
        stakeTimes[msg.sender] = block.timestamp;

        stakingToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function claimRewards() external nonReentrant {
        uint256 reward = earned(msg.sender);
        require(reward > 0, "WcosStaking: no rewards to claim");

        rewards[msg.sender] = 0;
        stakeTimes[msg.sender] = block.timestamp; // Reset yield accrual start time

        rewardToken.safeTransfer(msg.sender, reward);
        emit RewardPaid(msg.sender, reward);
    }

    function emergencyWithdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "WcosStaking: no stake to withdraw");

        balances[msg.sender] = 0;
        rewards[msg.sender] = 0;
        stakeTimes[msg.sender] = 0;
        unlockTimes[msg.sender] = 0;
        lockDurations[msg.sender] = 0;

        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }
}
