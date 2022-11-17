const { expect, assert } = require("chai")
const { ethers, deployments, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Testing BasicNft Contract", function () {
          let BasicNft, deployer
          beforeEach(async function () {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["basicnft"])
              BasicNft = await ethers.getContract("BasicNft")
          })

          describe("Constructor", function () {
              it("It initialize all variables correctly", async function () {
                  const tokenCounter = await BasicNft.getTokenCounter()
                  assert.equal(tokenCounter.toString(), "0")
              })
          })

          describe("Minting function is working properly", function () {
              it("Mint and update token Counter properly", async function () {
                  await BasicNft.mintNft()
                  const tokenCounter = await BasicNft.getTokenCounter()
                  assert.equal(tokenCounter.toString(), "1")
              })

              it("get correct token URI", async function () {
                  await BasicNft.mintNft()
                  const tokenUri = await BasicNft.tokenURI(0)
                  console.log(tokenUri)
                  assert.equal(
                      tokenUri,
                      "https://gateway.pinata.cloud/ipfs/QmeW816aqK9N3CpBypLWKfXA68WbTdNPnNeNBbJaiEW8h1"
                  )
              })
          })
      })
