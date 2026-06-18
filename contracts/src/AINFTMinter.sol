// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AINFTMinter is ERC721URIStorage, ERC2981, Ownable {
    uint256 public nextTokenId;
    uint256 public constant mintFee = 0.005 ether;

    constructor() ERC721("AI Studio Collective", "AIS") {
        _setDefaultRoyalty(msg.sender, 500);
    }

    function mintAINFT(address recipient, string memory _tokenURI) external payable returns (uint256) {
        require(msg.value == mintFee, "AINFTMinter: incorrect mint fee");
        uint256 tokenId = nextTokenId;
        nextTokenId = tokenId + 1;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        return tokenId;
    }

    function withdrawEarnings() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "AINFTMinter: no earnings to withdraw");
        payable(owner()).transfer(balance);
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
