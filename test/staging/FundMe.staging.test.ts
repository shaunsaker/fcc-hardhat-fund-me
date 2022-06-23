import { expect } from "chai"
import { ethers, getNamedAccounts, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { FundMe, MockV3Aggregator } from "../../typechain"

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", () => {
          let fundMe: FundMe
          let deployer: string
          // TODO: SS it would be cool if we could first fund the account from a faucet programmatically
          const sendValue = ethers.utils.parseEther("0.05")

          beforeEach(async () => {
              const namedAccounts = await getNamedAccounts()
              deployer = namedAccounts.deployer

              fundMe = await ethers.getContract("FundMe", deployer)
          })

          it("allows people to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )

              expect(endingBalance.toString()).to.equal("0")
          })
      })
