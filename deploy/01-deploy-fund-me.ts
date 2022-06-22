import { network } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains, networkConfig } from "../helper-hardhat-config"

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
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
    })

    log("--------------------------------")
}

module.exports.tags = ["all", "fundme"]
