import { network } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import {
    BLOCK_CONFIRMATIONS,
    developmentChains,
    networkConfig,
} from "../helper-hardhat-config"
import { verify } from "../utils/verify"

module.exports = async ({
    getNamedAccounts,
    deployments,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    let ethUsdPriceFeedAddress

    if (developmentChains.includes(network.name)) {
        // if the contract doesn't exist, we deploy a minimal version of it for our local testing
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")

        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[network.name].ethUsdPriceFeed
    }

    // when going for localhost or hardhat network we want to use a mock
    const fundMeArgs = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: fundMeArgs,
        log: true,
        waitConfirmations: BLOCK_CONFIRMATIONS,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        // verify the contract if not in development
        await verify(fundMe.address, fundMeArgs)
    }

    log("--------------------------------")
}

module.exports.tags = ["all", "fundme"]
