import { expect } from "chai"
import { deployments, ethers, getNamedAccounts, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { FundMe, MockV3Aggregator } from "../../typechain"

!developmentChains.includes(network.name)
    ? describe.skip // TODO: me no likey, is there a better way to do this?
    : describe("FundMe", () => {
          let fundMe: FundMe
          let deployer: string
          let mockV3Aggregator: MockV3Aggregator
          const sendValue = ethers.utils.parseEther("1")

          beforeEach(async () => {
              // deploy the FundMe contract (incl. mocks)
              await deployments.fixture("all")

              const namedAccounts = await getNamedAccounts()
              deployer = namedAccounts.deployer

              // TODO: can we get the contract name from a variable? What if we rename the contract, then all of our tests break
              fundMe = await ethers.getContract("FundMe", deployer)

              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          // in the tutorial the describes wrap each function in the Contract, e.g. the constructor or modifiers
          // but IMO we should not test implementation details but rather the results of specific Contract actions
          // regardless of the structure of the code
          it("initialises the aggregator addresses correctly", async () => {
              const response = await fundMe.getPriceFeed()

              expect(response).to.equal(mockV3Aggregator.address)
          })

          describe("fund", () => {
              it("fails if you don't send enough ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "FundMe__NotEnough"
                  )
              })

              it("keeps track of the address and amount funded", async () => {
                  await fundMe.fund({ value: sendValue })

                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )

                  expect(response.toString()).to.equal(sendValue.toString())
              })

              it("keeps track of funder's addresses", async () => {
                  await fundMe.fund({ value: sendValue })

                  const funder = await fundMe.getFunder(0)

                  expect(funder).to.equal(deployer)
              })
          })

          describe("withdraw", () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraws ETH from a single funder", async () => {
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const gasCost = transactionReceipt.gasUsed.mul(
                      transactionReceipt.effectiveGasPrice
                  )
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  expect(endingFundMeBalance).to.equal(0)
                  // FIXME: extract these into variables, it's confusing AF
                  expect(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  ).to.equal(endingDeployerBalance.add(gasCost).toString())
              })

              it("allows us to withdraw with multiple funders", async () => {
                  const accounts = await ethers.getSigners()

                  // TODO: why 6? why not accounts.length?
                  // TODO: does async await work in a for loop?
                  // we start at 1 because the 0th index is the deployer
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const gasCost = transactionReceipt.gasUsed.mul(
                      transactionReceipt.effectiveGasPrice
                  )
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // TODO: what is the difference between await expect ...  and expect(await ...)
                  // make sure that the funders are reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  // TODO: instead of looping could we just check that funders.length is 0 and the getAddressToAmountFunded is empty?
                  for (let i = 1; i < 6; i++) {
                      expect(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          )
                      ).to.equal(0)
                  }
              })

              it("only allows the owner to withdraw", async () => {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1] // the 0th index should be the deployer
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )

                  // TODO: using the error message is string is flakey, can we use a var from Solidity?
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })
          })
      })
