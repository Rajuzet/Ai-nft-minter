// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract AINFTMinter is ERC721URIStorage, ERC2981, Ownable2Step {
    uint256 public nextTokenId;
    uint256 public immutable maxSupply;

    uint8 public constant TIER_BASIC = 0;
    uint8 public constant TIER_STANDARD = 1;
    uint8 public constant TIER_FULL = 2;

    mapping(uint8 => uint256) public tierPrice;
    mapping(uint256 => bytes32) public contentHash;

    event TokenMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        string tokenURI,
        uint8 tier,
        bytes32 contentHash
    );
    event TierPriceUpdated(uint8 indexed tier, uint256 price);

    constructor(uint256 _maxSupply) ERC721("AI Studio Collective", "AIS") {
        maxSupply = _maxSupply;
        _setDefaultRoyalty(msg.sender, 500);
        tierPrice[TIER_BASIC] = 0.005 ether;
        tierPrice[TIER_STANDARD] = 0.01 ether;
        tierPrice[TIER_FULL] = 0.02 ether;
    }

    function setTierPrice(uint8 tier, uint256 price) external onlyOwner {
        require(tier <= TIER_FULL, "AINFTMinter: invalid tier");
        tierPrice[tier] = price;
        emit TierPriceUpdated(tier, price);
    }

    function mintAINFT(
        address recipient,
        string memory _tokenURI,
        uint8 tier,
        bytes32 _contentHash
    ) external payable returns (uint256) {
        require(tier <= TIER_FULL, "AINFTMinter: invalid tier");
        require(msg.value == tierPrice[tier], "AINFTMinter: incorrect mint fee");
        if (maxSupply > 0) {
            require(nextTokenId < maxSupply, "AINFTMinter: max supply reached");
        }

        uint256 tokenId = nextTokenId;
        nextTokenId = tokenId + 1;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        if (tier == TIER_FULL) {
            require(_contentHash != bytes32(0), "AINFTMinter: content hash required for full tier");
            contentHash[tokenId] = _contentHash;
        }

        emit TokenMinted(
            recipient,
            tokenId,
            _tokenURI,
            tier,
            (tier == TIER_FULL) ? _contentHash : bytes32(0)
        );
        return tokenId;
    }

    function verifyContent(uint256 tokenId, bytes memory assetBytes) public view returns (bool) {
        bytes32 expected = contentHash[tokenId];
        if (expected == bytes32(0)) {
            return false;
        }
        return sha256(assetBytes) == expected;
    }

    function withdrawEarnings() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "AINFTMinter: no earnings to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "AINFTMinter: withdrawal failed");
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721URIStorage) returns (string memory) {
        return ERC721URIStorage.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721URIStorage, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
