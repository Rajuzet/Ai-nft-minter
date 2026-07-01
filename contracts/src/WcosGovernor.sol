// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./WcosGovernanceToken.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract WcosGovernor is ReentrancyGuard {
    
    enum ProposalState { Pending, Active, Defeated, Succeeded, Executed }

    struct Proposal {
        address proposer;
        address target;
        uint256 value;
        bytes data;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
    }

    WcosGovernanceToken public token;
    uint256 public proposalCount;
    uint256 public quorumPercentage; // e.g. 10 = 10%
    uint256 public votingDurationBlocks; // e.g. 5760 = ~1 day

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, address target, uint256 value, string description);
    event VoteCast(address indexed voter, uint256 indexed proposalId, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);

    constructor(WcosGovernanceToken _token, uint256 _quorumPercentage, uint256 _votingDurationBlocks) {
        token = _token;
        quorumPercentage = _quorumPercentage;
        votingDurationBlocks = _votingDurationBlocks;
    }

    function propose(
        address target,
        uint256 value,
        bytes memory data,
        string memory description
    ) external returns (uint256) {
        // Enforce basic proposal threshold (e.g. proposer must hold some tokens)
        require(token.balanceOf(msg.sender) > 0, "WcosGovernor: proposer must hold governance tokens");

        uint256 proposalId = proposalCount;
        proposalCount++;

        proposals[proposalId] = Proposal({
            proposer: msg.sender,
            target: target,
            value: value,
            data: data,
            description: description,
            startBlock: block.number,
            endBlock: block.number + votingDurationBlocks,
            forVotes: 0,
            againstVotes: 0,
            executed: false
        });

        emit ProposalCreated(proposalId, msg.sender, target, value, description);
        return proposalId;
    }

    function castVote(uint256 proposalId, bool support) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(block.number >= proposal.startBlock && block.number <= proposal.endBlock, "WcosGovernor: voting closed");
        require(!hasVoted[proposalId][msg.sender], "WcosGovernor: already voted");

        uint256 weight = token.getPastVotes(msg.sender, proposal.startBlock);
        if (weight == 0) {
            // Fallback to current balance if no checkpoint block resolved
            weight = token.balanceOf(msg.sender);
        }
        require(weight > 0, "WcosGovernor: no voting weight");

        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        hasVoted[proposalId][msg.sender] = true;
        emit VoteCast(msg.sender, proposalId, support, weight);
    }

    function execute(uint256 proposalId) external payable nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(block.number > proposal.endBlock, "WcosGovernor: voting still active");
        require(!proposal.executed, "WcosGovernor: already executed");

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 totalSupply = token.totalSupply();
        uint256 quorum = (totalSupply * quorumPercentage) / 100;

        require(totalVotes >= quorum, "WcosGovernor: quorum not met");
        require(proposal.forVotes > proposal.againstVotes, "WcosGovernor: proposal defeated");

        proposal.executed = true;
        
        // Execute target transaction payload
        (bool success, ) = proposal.target.call{value: proposal.value}(proposal.data);
        require(success, "WcosGovernor: transaction execution failed");

        emit ProposalExecuted(proposalId);
    }

    function state(uint256 proposalId) external view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.executed) {
            return ProposalState.Executed;
        }
        if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        }
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 quorum = (token.totalSupply() * quorumPercentage) / 100;
        if (totalVotes < quorum || proposal.forVotes <= proposal.againstVotes) {
            return ProposalState.Defeated;
        }
        return ProposalState.Succeeded;
    }
}
