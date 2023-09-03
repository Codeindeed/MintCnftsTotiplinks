"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@tiplink/api");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// create custom wallets
const collectionName = "Superteam Bounty";
const collectionDescription = "This Collection is to show the participation of Superteam Bounties";
const nftName = "Superteam Bounty";
//Create Wallets that The Nfts would be Distributed to
function Createwallet() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Creating Wallets");
        if (!process.env.COLLECTION_MINT)
            throw new Error("No Collection Mint Address");
        const amount = Number(process.env.COLLECTION_MINT);
        //array of strings in ts is string[]
        const create = () => __awaiter(this, void 0, void 0, function* () {
            const { url: { href }, } = yield api_1.TipLink.create();
            const tip = yield api_1.TipLink.fromLink(href);
            return {
                address: tip.keypair.publicKey.toBase58(),
                link: href,
            };
        });
        const Wallets = [];
        for (let i = 0; i < amount; i++) {
            console.log(`Creating Wallet ${i + 1} of ${amount}`);
            Wallets.push(yield create());
        }
        console.log("Wallets created");
        return Wallets;
    });
}
// Create Collection on UnderDog to mint To
function Createcollection(custom) {
    return __awaiter(this, void 0, void 0, function* () {
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
            }
            else {
                const res = yield fetch(`${process.env.UNDERDOG_API}`, options);
                if (!res.ok)
                    throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
                const data = yield res.json();
                if (data.mintAddress) {
                    console.log(`Project ID: ${data.projectId} and Mint Address: ${data.mintAddress}`);
                    return data.projectId;
                }
                else {
                    throw new Error("Couldnt Mint Collection");
                }
            }
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    });
}
// MintNFTs to Collection on UnderDo
const Mintnfts = (wallet, projectId) => __awaiter(void 0, void 0, void 0, function* () {
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
        const res = yield fetch(`${process.env.UNDERDOG_API}/${projectId}/nfts`, options);
        if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
        }
        const data = yield res.json();
        if (data.transactionId) {
            return true; // Minting was successful
        }
        else {
            throw new Error("Minting NFTs failed"); // Handle unexpected response
        }
    }
    catch (err) {
        console.error(`Mintnfts error: ${err.message}`);
        return false; // Return false to indicate failur
    }
});
// Mint nfts to Collection and push out tiplinks to claim into a new file!
function Mintall() {
    return __awaiter(this, void 0, void 0, function* () {
        // Create ProjectId if you have Project Id change value to true and Input Project ID
        const projectId = yield Createcollection({ value: true, projectId: 19 });
        //Create Wallets or Generate tiplink Wallets
        const wallets = yield Createwallet();
        const links = [];
        for (const wallet of wallets) {
            const mintSuccessful = yield Mintnfts(wallet.address, projectId);
            if (mintSuccessful) {
                links.push(wallet.link);
                console.log(links);
            }
            else {
                console.error(`Minting NFT for wallet ${wallet.address} failed.`);
            }
        }
        const mintLinksFilePath = "mint_links.txt"; // Define the file path
        fs_1.default.writeFileSync(mintLinksFilePath, links.join("\n"));
        console.log("Mint links saved to:", mintLinksFilePath);
    });
}
Mintall().catch((err) => {
    console.error("An erro occurr:", err);
});
