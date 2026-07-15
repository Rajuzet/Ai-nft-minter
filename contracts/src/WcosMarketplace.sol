// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract WcosMarketplace is ReentrancyGuard, Ownable2Step, Pausable {
    
    uint256 private _listingIds;

    struct Listing {
        uint256 listingId;
        address nftAddress;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool active;
    }

    uint256 public feeBps;
    uint256 public constant maxFeeBps = 1000; // 10% cap
    address public feeRecipient;

    // Mapping from listingId => Listing
    mapping(uint256 => Listing) public listings;

    event TokenListed(uint256 indexed listingId, address indexed nftAddress, uint256 indexed tokenId, address seller, uint256 price);
    event TokenBought(uint256 indexed listingId, address indexed nftAddress, uint256 indexed tokenId, address buyer, address seller, uint256 price, uint256 royaltyPaid, uint256 feePaid);
    event TokenListingCancelled(uint256 indexed listingId, address indexed nftAddress, uint256 indexed tokenId, address seller);
    event MarketplaceFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event MarketplaceFeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    constructor() {
        feeRecipient = msg.sender;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= maxFeeBps, "WcosMarketplace: fee exceeds max limit");
        emit MarketplaceFeeUpdated(feeBps, _feeBps);
        feeBps = _feeBps;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "WcosMarketplace: invalid fee recipient");
        emit MarketplaceFeeRecipientUpdated(feeRecipient, _feeRecipient);
        feeRecipient = _feeRecipient;
    }

    function listToken(address nftAddress, uint256 tokenId, uint256 price) external whenNotPaused nonReentrant returns (uint256) {
        require(price > 0, "WcosMarketplace: price must be greater than zero");
        
        IERC721 nft = IERC721(nftAddress);
        require(nft.ownerOf(tokenId) == msg.sender, "WcosMarketplace: you are not the owner");
        
        // Transfer the token into the marketplace escrow
        nft.transferFrom(msg.sender, address(this), tokenId);

        _listingIds++;
        uint256 newListingId = _listingIds;

        listings[newListingId] = Listing({
            listingId: newListingId,
            nftAddress: nftAddress,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true
        });

        emit TokenListed(newListingId, nftAddress, tokenId, msg.sender, price);
        return newListingId;
    }

    function buyToken(uint256 listingId) external payable whenNotPaused nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "WcosMarketplace: listing is not active");
        require(msg.value >= listing.price, "WcosMarketplace: insufficient payment");

        listing.active = false;

        uint256 salePrice = listing.price;
        uint256 royaltyAmount = 0;
        address royaltyReceiver = address(0);

        // Attempt to resolve ERC-2981 royalties
        try IERC2981(listing.nftAddress).royaltyInfo(listing.tokenId, salePrice) returns (address receiver, uint256 amount) {
            if (receiver != address(0) && amount > 0 && amount < salePrice) {
                royaltyReceiver = receiver;
                royaltyAmount = amount;
            }
        } catch {}

        uint256 feeAmount = (salePrice * feeBps) / 10000;
        require(royaltyAmount + feeAmount < salePrice, "WcosMarketplace: royalties and fees exceed price");

        // Pay fee if resolved
        if (feeAmount > 0 && feeRecipient != address(0)) {
            (bool feeOk, ) = payable(feeRecipient).call{value: feeAmount}("");
            require(feeOk, "WcosMarketplace: fee payment failed");
        }

        // Pay royalties if resolved
        if (royaltyReceiver != address(0) && royaltyAmount > 0) {
            (bool royaltyOk, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            require(royaltyOk, "WcosMarketplace: royalty payment failed");
        }

        // Pay remainder to seller
        uint256 sellerProceeds = salePrice - royaltyAmount - feeAmount;
        (bool sellerOk, ) = payable(listing.seller).call{value: sellerProceeds}("");
        require(sellerOk, "WcosMarketplace: seller payment failed");

        // Refund excess payment
        if (msg.value > salePrice) {
            (bool refundOk, ) = payable(msg.sender).call{value: msg.value - salePrice}("");
            require(refundOk, "WcosMarketplace: refund failed");
        }

        // Transfer NFT from escrow to buyer
        IERC721(listing.nftAddress).safeTransferFrom(address(this), msg.sender, listing.tokenId);

        emit TokenBought(listingId, listing.nftAddress, listing.tokenId, msg.sender, listing.seller, salePrice, royaltyAmount, feeAmount);
    }

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "WcosMarketplace: listing is not active");
        require(listing.seller == msg.sender, "WcosMarketplace: you are not the seller");

        listing.active = false;

        // Return NFT to the seller
        IERC721(listing.nftAddress).safeTransferFrom(address(this), msg.sender, listing.tokenId);

        emit TokenListingCancelled(listingId, listing.nftAddress, listing.tokenId, msg.sender);
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
