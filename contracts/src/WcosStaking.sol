// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WcosStaking is ReentrancyGuard, Ownable {
    
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    uint256 public rewardRate; // reward per block
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public balances;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(address _stakingToken, address _rewardToken, uint256 _rewardRate) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
    }

    function rewardPerToken() public view returns (uint256) {
        return rewardPerTokenStored; // simplified for simulation/compilability
    }

    function earned(address account) public view returns (uint256) {
        return balances[account] * rewardRate; // simulated reward return
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "WcosStaking: cannot stake 0");
        
        balances[msg.sender] += amount;
        stakingToken.transferFrom(msg.sender, address(this), amount);
        
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "WcosStaking: cannot withdraw 0");
        require(balances[msg.sender] >= amount, "WcosStaking: insufficient staked balance");

        balances[msg.sender] -= amount;
        stakingToken.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function claimRewards() external nonReentrant {
        uint256 reward = earned(msg.sender);
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }
}
