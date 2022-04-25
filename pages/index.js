import { ethers } from "ethers";
import { useEffect, useState } from "react"; //useState is for use the local state and useEffect is to invoke a function when the component loads.
import axios from "axios";
import Web3Modal from "web3modal"; //Connect to ethereum wallet.

//Get the marketplace and the NFT address
import { nftaddress, nftmarketaddress } from "../config";

//Get the ABI's. (JSON representation of the smart contract, allows us to interact with the smart contract)
import NFT from "../artifacts/contracts/NFT.sol/NFT.json";
import Market from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json";

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState("not-loaded");

  useEffect(() => {
    loadNfts();
  }, []);

  async function loadNfts() {
    //Call the smart contracts and fetch the NFT's
    const provider = new ethers.providers.JsonRpcProvider(); //Connect to the blockchain.

    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider); //Reference to the NFT smart contract
    const marketContract = new ethers.Contract(
      nftmarketaddress,
      Market.abi,
      provider
    ); //Reference to the NFT market smart contract

    const data = await marketContract.fetchMarketItems(); //Fetch the NFT's from the smart contract.

    //Map the data to convert it to an array of objects.
    const items = await Promise.all(
      data.map(async (i) => {
        const tokenUri = await tokenContract.tokenURI(i.tokenId); //Get the URI of the token (URL).
        const meta = await axios.get(tokenUri); //Get the metadata from the NFT's.
        let price = ethers.utils.formatUnits(i.price.toString(), "ether"); //Format the price to ether.
        const item = {
          //Represent the NFT's as an object.
          price,
          tokenId: i.tokenId.toString(),
          seller: i.seller,
          owner: i.owner,
          imagen: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
        };
        return item;
      })
    );

    setNfts(items); //Set the state with the NFT's.
    setLoadingState("loaded"); //Change loading state to loaded.
  }

  async function buyNft(nft) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect(); //Connect the user to the ethereum wallet.
    const provider = new ethers.providers.Web3Provider(connection); //Connect to the blockchain.

    const signer = provider.getSigner(); //Create a signer to sign the transaction.
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer); //Get the reference to the smart contract.

    const price = ethers.utils.parseUnits(nft.price.toString(), "ethers"); //Convert the price to ether.

    //Create market sale.
    const transaction = await contract.createMarketSale(
      nftaddress,
      nft.tokenId,
      {
        value: price,
      }
    );

    await transaction.wait(); //Wait for the transaction to be mined.

    loadNfts(); //Reload the NFT's.
  }

  if (loadingState === "loaded" && !nfts.length)
    //If the component is loaded and there are no NFT's.
    return <h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>;
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: "1600px" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {nfts.map((nft, i) => {
            <div key={i} className="border shadow rounded-xl overflow-hidden">
              <img src={nft.image} />
              <div className="p-4">
                <p
                  style={{ height: "64px" }}
                  className="text-2xl font-semibold"
                >
                  {nft.name}
                </p>
                <div style={{ height: "70px", overflow: "hidden" }}>
                  <p className="text-gray-400">{nft.description}</p>
                </div>
              </div>
              <div className="p-4 bg-black">
                <p className="text-2xl mb-4 font-bold text-white">
                  {nft.price} ETH
                </p>
                <button
                  className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded"
                  onClick={() => buyNft(nft)}
                >
                  Buy
                </button>
              </div>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}
