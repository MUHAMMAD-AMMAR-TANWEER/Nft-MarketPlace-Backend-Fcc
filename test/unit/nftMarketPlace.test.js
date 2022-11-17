const { assert, expect } = require("chai")
const { ethers, deployments, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NFT Market Place testing", function () {
          let nftMarketplaceContract, nftMarketplace, deployer, player, accounts, basicNftContract
          const PRICE = ethers.utils.parseEther("0.01")
          const TOKEN_ID = 0
          beforeEach(async function () {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]
              await deployments.fixture(["all"])
              nftMarketplaceContract = await ethers.getContract("NftMarketplace")
              nftMarketplace = await nftMarketplaceContract.connect(deployer)
              basicNftContract = await ethers.getContract("BasicNft")
              basicNft = await basicNftContract.connect(deployer)
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplaceContract.address, TOKEN_ID)
          })

          describe("ListItem Function", function () {
              it("reverts when price is less then or equal to zero", async function () {
                  await basicNft.approve(nftMarketplaceContract.address, TOKEN_ID)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero")
              })
              it("reverts when address of nft is not approved", async function () {
                  await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)

                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotApprovedForMarketPlace")
              })
              it("Emits an event when all things are accurate", async function () {
                  await expect(nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                      nftMarketplace,
                      "ItemListed"
                  )
              })

              it("Only Owner can list the nft", async function () {
                  nftMarketplace = await nftMarketplaceContract.connect(player)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotOwner")
              })

              it("Don't relist the NFT which is already listed", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

                  const error = `NftMarketplace__AlreadyListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(error)
              })
              it("Updates the listing properly", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const Listing = await nftMarketplace.get_listing(basicNft.address, TOKEN_ID)
                  //   console.log(Listing.price.toString())
                  //   console.log(PRICE.toString())
                  assert.equal(Listing.price.toString(), PRICE.toString())
                  assert.equal(Listing.seller, deployer.address)
              })
          })

          describe("BuyItems", function () {
              it("Only allows listed Nft available for buying", async function () {
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })

              it("Reverts when price is not paid as mention in NFT", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

                  const error = `NftMarketplace__PriceNotMet("${basicNft.address}", ${TOKEN_ID}, ${PRICE})`
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(error)
              })

              it("Emits an event when buyer bought NFt and update listing as well", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplace = await nftMarketplaceContract.connect(player) //player connected with nftmarketplace
                  expect(
                      await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  ).to.emit("ItemBought")

                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  const sellerBalance = await nftMarketplace.getProceeds(deployer.address)
                  assert.equal(sellerBalance.toString(), PRICE.toString())
                  assert.equal(newOwner.toString(), player.address)
              })
          })

          describe("Cancel Listing", function () {
              it("Reverts CancelListing if the NFT is not listed", async function () {
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })

              it("Only Owner can call cancelListing", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplace = await nftMarketplaceContract.connect(player)
                  await basicNft.approve(player.address, TOKEN_ID)
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotOwner")
              })

              it("Emits event on successful cancel Listing", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  expect(await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
                      "ItemCancelled"
                  )
              })
          })

          describe("Update Listing ", function () {
              it("Nft should be listed to call update Listing ", async function () {
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })

              it("Only Owner can call Update Listing", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplace = await nftMarketplaceContract.connect(player)
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotOwner")
              })

              it("Not update listing if price <=0", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const newPrice = ethers.utils.parseEther("0")
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
                  ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero")
              })

              it("Emits event when Updating List call successfully and updates the price", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const newPrice = ethers.utils.parseEther("0.2")
                  expect(
                      await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
                  ).to.emit("ItemListed")

                  const newListing = await nftMarketplace.get_listing(basicNft.address, TOKEN_ID)
                  const Price = newListing.price.toString()
                  assert.equal(Price, newPrice.toString())
              })
          })

          describe("withdrawProceeds", function () {
              it("Throws error when no proceeds in marketPlace", async function () {
                  await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith(
                      "NftMarketplace__NoProceeds"
                  )
              })

              it("Enable user to withdraw proceed and update balance", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplace = await nftMarketplaceContract.connect(player)
                  await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  nftMarketplace = await nftMarketplaceContract.connect(deployer)

                  const deployerProceedsBefore = await nftMarketplace.getProceeds(deployer.address)
                  const deployerBalanceBefore = await deployer.getBalance()
                  const txResponse = await nftMarketplace.withdrawProceeds()
                  const transactionReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const GasCost = gasUsed.mul(effectiveGasPrice)
                  const deployerBalanceAfter = await deployer.getBalance()

                  assert(
                      deployerBalanceAfter.add(GasCost).toString() ==
                          deployerProceedsBefore.add(deployerBalanceBefore).toString()
                  )
              })
          })
      })
