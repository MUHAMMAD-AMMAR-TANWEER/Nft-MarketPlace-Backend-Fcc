const { ethers } = require("hardhat")

const PRICE = ethers.utils.parseEther("0.1")
async function mintAndList() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    console.log("Minting NFT...")
    const mintTx = await basicNft.mintNft()
    const mintTxRecipt = await mintTx.wait(1)
    const TOKEN_ID = mintTxRecipt.events[0].args.tokenId
    console.log("Approving NFT...........")
    const approvalTx = await basicNft.approve(nftMarketplace.address, TOKEN_ID)
    await approvalTx.wait(1)
    console.log("Listing NFT................")
    const tx = await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
    await tx.wait(1)
    console.log("Listed Nft")
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
