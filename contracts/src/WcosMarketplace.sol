// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WcosMarketplace is ReentrancyGuard, Ownable {
    
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    // Mapping from NFT contract address => tokenId => Listing
    mapping(address => mapping(uint256 => Listing)) public listings;

    event TokenListed(address indexed nftAddress, uint256 indexed tokenId, address indexed seller, uint256 price);
    event TokenBought(address indexed nftAddress, uint256 indexed tokenId, address indexed buyer, address seller, uint256 price, uint256 royaltyPaid);
    event TokenListingCancelled(address indexed nftAddress, uint256 indexed tokenId, address indexed seller);

    function listToken(address nftAddress, uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "WcosMarketplace: price must be greater than zero");
        
        IERC721 nft = IERC721(nftAddress);
        require(nft.ownerOf(tokenId) == msg.sender, "WcosMarketplace: you are not the owner");
        
        // Transfer the token into the marketplace escrow
        nft.transferFrom(msg.sender, address(this), tokenId);

        listings[nftAddress][tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });

        emit TokenListed(nftAddress, tokenId, msg.sender, price);
    }

    function buyToken(address nftAddress, uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[nftAddress][tokenId];
        require(listing.active, "WcosMarketplace: listing is not active");
        require(msg.value >= listing.price, "WcosMarketplace: insufficient payment");

        listing.active = false;

        uint256 salePrice = listing.price;
        uint256 royaltyAmount = 0;
        address royaltyReceiver = address(0);

        // Attempt to resolve ERC-2981 royalties
        try IERC2981(nftAddress).royaltyInfo(tokenId, salePrice) returns (address receiver, uint256 amount) {
            if (receiver != address(0) && amount > 0 && amount < salePrice) {
                royaltyReceiver = receiver;
                royaltyAmount = amount;
            }
        } catch {}

        // Pay royalties if resolved
        if (royaltyReceiver != address(0) && royaltyAmount > 0) {
            payable(royaltyReceiver).transfer(royaltyAmount);
        }

        // Pay remainder to seller
        uint256 sellerProceeds = salePrice - royaltyAmount;
        payable(listing.seller).transfer(sellerProceeds);

        // Refund excess payment
        if (msg.value > salePrice) {
            payable(msg.sender).transfer(msg.value - salePrice);
        }

        // Transfer NFT from escrow to buyer
        IERC721(nftAddress).safeTransferFrom(address(this), msg.sender, tokenId);

        emit TokenBought(nftAddress, tokenId, msg.sender, listing.seller, salePrice, royaltyAmount);
    }

    function cancelListing(address nftAddress, uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[nftAddress][tokenId];
        require(listing.active, "WcosMarketplace: listing is not active");
        require(listing.seller == msg.sender, "WcosMarketplace: you are not the seller");

        listing.active = false;

        // Return NFT to the seller
        IERC721(nftAddress).safeTransferFrom(address(this), msg.sender, tokenId);

        emit TokenListingCancelled(nftAddress, tokenId, msg.sender);
    }

    // Required function to receive ERC-721 tokens safely in escrow
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
