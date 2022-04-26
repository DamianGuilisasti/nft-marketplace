import { useState } from "react";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import { create as ipfsHttpClient } from "ipfs-http-client";
import Web3Modal from "web3modal";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0"); // Infura URL to sets and pins files to IPFS.

import { nftaddress, nftmarketaddress } from "../config"; // NFT contract address and NFT Market contract address references.

// Import the ABI's configuration for the NFT and NFT Market contracts.
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null);
  const [formInput, updateFormInput] = useState({
    price: "",
    name: "",
    description: "",
  });

  const router = useRouter();

  async function onChange(e) {
    //Is going to be invoked when the user selects a file.
    const file = e.target.files[0]; //The file that the user selected.
    try {
      const added = await client.add(file, {
        progress: (prog) => console.log(prog),
      }); //Adds the file to IPFS and get the progress of the operation.

      //Create the url of that file.
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;

      //Set the url of the file to the state.
      setFileUrl(url);
    } catch (error) {
      console.error(error);
    }
  }
  //Function to create the item and saving it to IPFS.

  async function createItem(url) {
    const { name, description, price } = formInput;

    if (!name || !description || !price) {
      alert("Please fill all the fields");
      return;
    }

    const data = JSON.stringify({
      name: name,
      description: description,
      image: fileUrl,
    }); //Convert the data to JSON to save it in IPFS.
    try {
      const added = await client.add(data); //Adds the file to IPFS.
      const url = `https://ipfs.infura.io/ipfs/${added.path}`; //Create the url of the metadata.
      createSale(url); //Function to set the token URL.
    } catch (error) {
      console.error(error);
    }
  }
  //Function to create the NFT and list it for sale in the marketplace.
  async function createSale(url) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect(); //Connect the user to the ethereum wallet.
    const provider = new ethers.providers.Web3Provider(connection); //Connect to the blockchain.
    const signer = provider.getSigner(); //Create a signer to sign the transaction.

    let nftContract = new ethers.Contract(nftaddress, NFT.abi, signer); //Reference to the NFT contract.
    let nftTransaction = await nftContract.createToken(url);
    let tx = await nftTransaction.wait(); //Wait for the transaction to be mined.

    let event = tx.events[0]; //Get the event of the transaction.
    let value = event.args[2]; //Get the value of the event.
    let tokenId = value.toNumber(); //Convert the big value to a number.

    const price = ethers.utils.parseUnits(formInput.price, "ether"); //Convert the price to ether.

    marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer); //Reference to the NFT Market contract.
    let listingPrice = await marketContract.getListingPrice(); //Get the price of the listing.
    listingPrice = listingPrice.toString();

    let marketTransaction = await marketContract.createMarketItem(
      nftaddress,
      tokenId,
      price,
      { value: listingPrice }
    ); //{value: listingPrice} means that amount of money is going to be extracted from the user's wallet.

    await marketTransaction.wait(); //Wait for the transaction to be mined.
    router.push("/"); //Redirect the user to the home page.
  }
}
