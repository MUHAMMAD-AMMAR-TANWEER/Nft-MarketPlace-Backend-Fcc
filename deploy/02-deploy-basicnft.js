const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
require("dotenv").config()
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, logs } = deployments
    const { deployer } = await getNamedAccounts()

    console.log("----------------------------------")

    const args = []
    const BasicNft = await deploy("BasicNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.VERIFICATION_BLOCK_CONFIRMATIONS || 1,
    })

    if (!developmentChains.includes(network.name)) {
        console.log("----------Verifying the contract-------------")
        await verify(BasicNft.address, args)
        console.log("Contract has been deployed")
    }

    console.log("---------------Basic NFT contract deployed---------------")
}

module.exports.tags = ["all", "basicnft"]
