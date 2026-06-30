// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WcosNFTCollection is ERC721URIStorage, ERC2981, Ownable {
    uint256 public nextTokenId;
    uint256 public maxSupply;

    event TokenMinted(address indexed recipient, uint256 indexed tokenId, string tokenURI);

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply,
        uint96 _royaltyNumerator,
        address _royaltyReceiver
    ) ERC721(_name, _symbol) {
        maxSupply = _maxSupply;
        if (_royaltyNumerator > 0 && _royaltyReceiver != address(0)) {
            _setDefaultRoyalty(_royaltyReceiver, _royaltyNumerator);
        }
    }

    function mintToken(address recipient, string memory _tokenURI) external onlyOwner returns (uint256) {
        if (maxSupply > 0) {
            require(nextTokenId < maxSupply, "WcosNFTCollection: max supply reached");
        }
        uint256 tokenId = nextTokenId;
        nextTokenId = tokenId + 1;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        
        emit TokenMinted(recipient, tokenId, _tokenURI);
        return tokenId;
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
