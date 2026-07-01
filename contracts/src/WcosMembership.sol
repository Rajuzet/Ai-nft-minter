// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title WcosMembership
/// @notice ERC-1155 tiered creator membership NFT (Bronze=1, Silver=2, Gold=3)
contract WcosMembership is ERC1155, Ownable, ReentrancyGuard {

    uint256 public constant BRONZE = 1;
    uint256 public constant SILVER = 2;
    uint256 public constant GOLD   = 3;

    mapping(uint256 => uint256) public tierPrice;  // tokenId => price in wei
    mapping(uint256 => uint256) public tierSupply; // tokenId => max supply
    mapping(uint256 => uint256) public tierMinted; // tokenId => minted count
    mapping(uint256 => string)  public tierName;

    string public name;
    string public symbol;

    event MembershipPurchased(address indexed buyer, uint256 indexed tierId, uint256 amount);
    event TierConfigured(uint256 indexed tierId, string name, uint256 price, uint256 maxSupply);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _metadataUri
    ) ERC1155(_metadataUri) {
        name   = _name;
        symbol = _symbol;

        // Default tier configuration
        _configureTier(BRONZE, "Bronze Member",  0.01 ether, 10000);
        _configureTier(SILVER, "Silver Member",  0.05 ether, 2000);
        _configureTier(GOLD,   "Gold Member",    0.10 ether, 500);
    }

    function _configureTier(uint256 tierId, string memory _name, uint256 price, uint256 maxSupply) internal {
        tierName[tierId]   = _name;
        tierPrice[tierId]  = price;
        tierSupply[tierId] = maxSupply;
        emit TierConfigured(tierId, _name, price, maxSupply);
    }

    function configureTier(uint256 tierId, string memory _name, uint256 price, uint256 maxSupply) external onlyOwner {
        _configureTier(tierId, _name, price, maxSupply);
    }

    function mint(uint256 tierId, uint256 amount) external payable nonReentrant {
        require(tierId >= BRONZE && tierId <= GOLD, "WcosMembership: invalid tier");
        require(amount > 0, "WcosMembership: amount must be > 0");
        require(tierMinted[tierId] + amount <= tierSupply[tierId], "WcosMembership: tier sold out");
        require(msg.value >= tierPrice[tierId] * amount, "WcosMembership: insufficient payment");

        tierMinted[tierId] += amount;
        _mint(msg.sender, tierId, amount, "");
        emit MembershipPurchased(msg.sender, tierId, amount);
    }

    /// @notice Check if an address holds any active membership
    function isMember(address account) external view returns (bool) {
        return balanceOf(account, BRONZE) > 0 ||
               balanceOf(account, SILVER) > 0 ||
               balanceOf(account, GOLD)   > 0;
    }

    /// @notice Get the highest tier an address holds
    function highestTier(address account) external view returns (uint256) {
        if (balanceOf(account, GOLD)   > 0) return GOLD;
        if (balanceOf(account, SILVER) > 0) return SILVER;
        if (balanceOf(account, BRONZE) > 0) return BRONZE;
        return 0;
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = owner().call{value: address(this).balance}("");
        require(ok, "WcosMembership: withdrawal failed");
    }
}
