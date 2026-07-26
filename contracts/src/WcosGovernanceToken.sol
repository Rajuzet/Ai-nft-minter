// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title WcosGovernanceToken
 * @notice ERC-20 governance token with Compound-style on-chain checkpoints.
 *
 * DELEGATION SEMANTICS
 * ─────────────────────
 * Following OpenZeppelin ERC20Votes semantics, token balance does NOT
 * automatically confer voting power.  A holder must call delegate() to
 * activate their checkpoint.  This is intentional: it makes transfers
 * cheaper (no checkpoint write on every transfer for undelegated holders).
 *
 * AUTO-DELEGATION ON MINT
 * ───────────────────────
 * The owner-callable mint() function auto-self-delegates the recipient.
 * This ensures newly minted tokens are immediately usable for governance
 * without requiring an extra transaction.  It mirrors the behaviour of
 * OZ ERC20Votes when users explicitly call delegate(self).
 *
 * The constructor-minted initial supply is NOT auto-delegated; the deployer
 * must call delegate() explicitly.  This matches standard practice and
 * avoids surprising checkpoint writes during deployment.
 *
 * NON-DELEGATION
 * ──────────────
 * A holder who has never called delegate() (and has not received a mint()
 * post-deployment) has 0 voting weight.  This is correct and intentional —
 * it prevents stale or transferred tokens from silently accumulating power.
 */
contract WcosGovernanceToken is ERC20, Ownable2Step {

    struct Checkpoint {
        uint32 fromBlock;
        uint256 votes;
    }

    mapping(address => address) public delegates;
    mapping(address => mapping(uint32 => Checkpoint)) public checkpoints;
    mapping(address => uint32) public numCheckpoints;

    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);

    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
        // Initial supply goes to deployer without auto-delegation;
        // deployer calls delegate() explicitly.
    }

    /**
     * @notice Mint `amount` tokens to `to` and auto-self-delegate so the
     *         recipient has immediate voting power without a separate tx.
     * @dev    Only callable by owner (DAO / multisig).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        // Auto-self-delegate if the recipient has no prior delegation.
        // This mirrors what the user would do in a separate delegate(self) call.
        if (delegates[to] == address(0)) {
            _delegate(to, to);
        }
    }

    function delegate(address delegatee) external {
        _delegate(msg.sender, delegatee);
    }

    function _delegate(address delegator, address delegatee) internal {
        address currentDelegate = delegates[delegator];
        delegates[delegator] = delegatee;
        emit DelegateChanged(delegator, currentDelegate, delegatee);
        _moveDelegates(currentDelegate, delegatee, balanceOf(delegator));
    }

    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256) {
        require(blockNumber < block.number, "WcosGovernanceToken: not yet determined");
        uint32 nCheckpoints = numCheckpoints[account];
        if (nCheckpoints == 0) return 0;

        if (checkpoints[account][nCheckpoints - 1].fromBlock <= blockNumber) {
            return checkpoints[account][nCheckpoints - 1].votes;
        }
        if (checkpoints[account][0].fromBlock > blockNumber) {
            return 0;
        }

        uint32 low = 0;
        uint32 high = nCheckpoints - 1;
        while (high > low) {
            uint32 middle = high - (high - low) / 2;
            Checkpoint memory cp = checkpoints[account][middle];
            if (cp.fromBlock == blockNumber) {
                return cp.votes;
            } else if (cp.fromBlock < blockNumber) {
                low = middle;
            } else {
                high = middle - 1;
            }
        }
        return checkpoints[account][low].votes;
    }

    function _moveDelegates(address srcRep, address dstRep, uint256 amount) internal {
        if (srcRep != dstRep && amount > 0) {
            if (srcRep != address(0)) {
                uint32 srcRepNum = numCheckpoints[srcRep];
                uint256 srcRepOld = srcRepNum > 0 ? checkpoints[srcRep][srcRepNum - 1].votes : 0;
                uint256 srcRepNew = srcRepOld - amount;
                _writeCheckpoint(srcRep, srcRepNum, srcRepOld, srcRepNew);
            }

            if (dstRep != address(0)) {
                uint32 dstRepNum = numCheckpoints[dstRep];
                uint256 dstRepOld = dstRepNum > 0 ? checkpoints[dstRep][dstRepNum - 1].votes : 0;
                uint256 dstRepNew = dstRepOld + amount;
                _writeCheckpoint(dstRep, dstRepNum, dstRepOld, dstRepNew);
            }
        }
    }

    function _writeCheckpoint(address delegatee, uint32 nCheckpoints, uint256 oldVotes, uint256 newVotes) internal {
        uint32 blockNumber = uint32(block.number);
        if (nCheckpoints > 0 && checkpoints[delegatee][nCheckpoints - 1].fromBlock == blockNumber) {
            checkpoints[delegatee][nCheckpoints - 1].votes = newVotes;
        } else {
            checkpoints[delegatee][nCheckpoints] = Checkpoint(blockNumber, newVotes);
            numCheckpoints[delegatee] = nCheckpoints + 1;
        }
        emit DelegateVotesChanged(delegatee, oldVotes, newVotes);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._afterTokenTransfer(from, to, amount);
        _moveDelegates(delegates[from], delegates[to], amount);
    }
}
