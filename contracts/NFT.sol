// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol"; //Allow us to set the token URI.
import "@openzeppelin/contracts/utils/Counters.sol"; //Utility for incrementing numbers in a contract.

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds; //NFT token ID counter.
    address contractAddress; //MarketPlace contract address.

    constructor(address marketplaceAddress) ERC721("Metaverse Tokens", "MEET") {
        contractAddress = marketplaceAddress;
    }

    function createToken(string memory tokenURI) public returns (uint256) {
        //Minting new tokens.
        _tokenIds.increment(); //Increment the token ID.
        uint256 newItemId = _tokenIds.current(); //Get the current token ID generated.

        _mint(msg.sender, newItemId); //the msg.sender is the creator and the newItemId is the Item Id.
        _setTokenURI(newItemId, tokenURI); //Set the token URI.
        setApprovalForAll(contractAddress, true); //Give the marketplace the approval to transact this token between users.
        return newItemId; //Return the token Id to the frontend app.
    }
}
