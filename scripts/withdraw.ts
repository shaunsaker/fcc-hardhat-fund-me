import { ethers, getNamedAccounts } from "hardhat"

async function main() {
    const namedAccounts = await getNamedAccounts()
    const deployer = namedAccounts.deployer
    const fundMe = await ethers.getContract("FundMe", deployer)

    console.log("Withdrawing...")
    const transactionResponse = await fundMe.withdraw()
    await transactionResponse.wait(1)
    console.log("Got it back!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
