const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
require("dotenv").config()
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, logs } = deployments
    const { deployer } = await getNamedAccounts()

    console.log("----------------DEPLOYING NFT MARKETPLACE CONTRACT---------------------")

    const args = [] //no constructor arguments in NftMarketPlace
    const NftMarketPlace = await deploy("NftMarketplace", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.VERIFICATION_BLOCK_CONFIRMATIONS || 1,
    })

    if (!developmentChains.includes(network.name)) {
        console.log("Verifying------------------------")
        await verify(NftMarketPlace.address, args)
        console.log("--------------Contract Verified----------------------------")
    }
    console.log("---------------------Contract Deployed-----------------------")
}
module.exports.tags = ["all", "nftmarketplace"]
