const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket", function () {
  it("Should create and execute market sales.", async function () {
    const Market = await ethers.getContractFactory("NFTMarket"); //Get the NFTMarket smart contract
    const market = await Market.deploy(); //Deploy the smart contract
    await market.deployed(); //Await for the smart contract to be deployed
    const marketAddress = market.address; //Get the address of the smart contract

    const NFT = await ethers.getContractFactory("NFT"); //Get the contract NFT smart contract
    const nft = await NFT.deploy(marketAddress); //Deploy the smart contract with the marketAddress as a parameter
    await nft.deployed(); //Await for the smart contract to be deployed
    const nftContractAddress = nft.address; //Get the address of the smart contract

    let listingPrice = await market.getListingPrice(); //Get the listing price
    listingPrice = listingPrice.toString(); //Convert the listing price to a string to be able to use it.

    const auctionPrice = ethers.utils.parseUnits("100", "ether"); //Convert the wei to ether.

    //Create tokens

    await nft.createToken("https://www.mytokenlocation.com"); //Create a token 1
    await nft.createToken("https://www.mytokenlocation2.com"); //Create a token 2

    //List the tokens

    await market.createMarketItem(nftContractAddress, 1, auctionPrice, {
      value: listingPrice,
    }); //List the token 1

    await market.createMarketItem(nftContractAddress, 2, auctionPrice, {
      value: listingPrice,
    }); //List the token 2

    //Get addresses for testing proposes.

    const [_, buyerAddress] = await ethers.getSigners(); //Get the address of the buyer

    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, {
      value: auctionPrice,
    }); //Connect to the app and create a sale for the token 1. We use connect() because we don't have a MetaMask account.

    //Get the items
    let items = await market.fetchMarketItems();

    items = await Promise.all(
      items.map(async (i) => {
        const tokenUri = await nft.tokenURI(i.tokenId);
        let item = {
          price: i.price.toString(),
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          owner: i.owner,
          tokenUri,
        };
        return item;
      })
    );

    console.log("items: ", items);
  });
});
