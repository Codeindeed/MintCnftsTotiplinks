import { TipLink } from "@tiplink/api";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
// create custom wallets
const collectionName: string = "Superteam Bounty";
const collectionDescription: string =
  "This Collection is to show the participation of Superteam Bounties";
const nftName: string = "Superteam Bounty";

type Wallet = {
  address: string;
  link: string;
};
//Create Wallets that The Nfts would be Distributed to
async function Createwallet() {
  console.log("Creating Wallets");
  if (!process.env.COLLECTION_MINT)
    throw new Error("No Collection Mint Address");
  const amount = Number(process.env.COLLECTION_MINT);
  //array of strings in ts is string[]
  const create = async () => {
    const {
      url: { href },
    } = await TipLink.create();
    const tip = await TipLink.fromLink(href);
    return {
      address: tip.keypair.publicKey.toBase58(),
      link: href,
    };
  };
  const Wallets: Wallet[] = [];
  for (let i = 0; i < amount; i++) {
    console.log(`Creating Wallet ${i + 1} of ${amount}`);
    Wallets.push(await create());
  }
  console.log("Wallets created");

  return Wallets;
}
// Create Collection on UnderDog to mint To
async function Createcollection(custom: { value: boolean; projectId: number }) {
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: "Bearer " + process.env.UNDERDOG_API_KEY,
    },
    body: JSON.stringify({
      name: collectionName,
      description: collectionDescription,
      image: process.env.NFT_URL,
    }),
  };
  try {
    if (custom.value) {
      console.log("project id", custom.projectId);

      return custom.projectId;
    } else {
      const res = await fetch(`${process.env.UNDERDOG_API}`, options);
      if (!res.ok)
        throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      if (data.mintAddress) {
        console.log(
          `Project ID: ${data.projectId} and Mint Address: ${data.mintAddress}`
        );
        return data.projectId;
      } else {
        throw new Error("Couldnt Mint Collection");
      }
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// MintNFTs to Collection on UnderDo
const Mintnfts = async (wallet: string, projectId: number) => {
  try {
    if (!process.env.NFT_URL) {
      throw new Error("No URL");
    }
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: "Bearer " + process.env.UNDERDOG_API_KEY,
      },
      body: JSON.stringify({
        receiverAddress: wallet,
        name: collectionName,
        description: collectionDescription,
        image: process.env.NFT_URL,
      }),
    };
    const res = await fetch(
      `${process.env.UNDERDOG_API}/${projectId}/nfts`,
      options
    );
    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (data.transactionId) {
      return true; // Minting was successful
    } else {
      throw new Error("Minting NFTs failed"); // Handle unexpected response
    }
  } catch (err) {
    console.error(`Mintnfts error: ${err.message}`);
    return false; // Return false to indicate failur
  }
};

// Mint nfts to Collection and push out tiplinks to claim into a new file!
async function Mintall() {
  // Create ProjectId if you have Project Id change value to true and Input Project ID
  const projectId = await Createcollection({ value: true, projectId: 19 });

  //Create Wallets or Generate tiplink Wallets
  const wallets: Wallet[] = await Createwallet();
  const links: string[] = [];
  for (const wallet of wallets) {
    const mintSuccessful = await Mintnfts(wallet.address, projectId);
    if (mintSuccessful) {
      links.push(wallet.link);
      console.log(links);
    } else {
      console.error(`Minting NFT for wallet ${wallet.address} failed.`);
    }
  }
  const mintLinksFilePath = "mint_links.txt"; // Define the file path
  fs.writeFileSync(mintLinksFilePath, links.join("\n"));
  console.log("Mint links saved to:", mintLinksFilePath);
}
Mintall().catch((err) => {
  console.error("An erro occurr:", err);
});
