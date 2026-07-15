// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract WcosTreasury is Ownable2Step {
    using SafeERC20 for IERC20;
    
    address public governor;

    event FundsReleased(address indexed recipient, uint256 amount);
    event TokenReleased(address indexed token, address indexed recipient, uint256 amount);
    event GovernorUpdated(address indexed previousGovernor, address indexed newGovernor);

    modifier onlyGovernor() {
        require(msg.sender == governor || msg.sender == owner(), "WcosTreasury: caller is not authorized");
        _;
    }

    constructor(address _governor) {
        governor = _governor;
    }

    function setGovernor(address _newGovernor) external onlyOwner {
        require(_newGovernor != address(0), "WcosTreasury: invalid address");
        emit GovernorUpdated(governor, _newGovernor);
        governor = _newGovernor;
    }

    function executeRelease(address payable recipient, uint256 amount) external onlyGovernor {
        require(address(this).balance >= amount, "WcosTreasury: insufficient balance");
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "WcosTreasury: release failed");
        emit FundsReleased(recipient, amount);
    }

    function executeTokenRelease(address token, address recipient, uint256 amount) external onlyGovernor {
        require(IERC20(token).balanceOf(address(this)) >= amount, "WcosTreasury: insufficient balance");
        IERC20(token).safeTransfer(recipient, amount);
        emit TokenReleased(token, recipient, amount);
    }

    // Required to receive Ether directly into the treasury
    receive() external payable {}
}
