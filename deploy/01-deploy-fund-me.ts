import { network } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { networkConfig } from "../helper-hardhat-config"

module.exports = async ({
    getNamedAccounts,
    deployments,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const { chainId } = network.config

    if (!chainId) {
        return
    }

    const ethUsdPriceFeed = networkConfig[chainId].ethUsdPriceFeed

    // if the contract doesn't exist, we deploy a minimal version of it for our local testing

    // when going for localhost or hardhat network we want to use a mock
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeed], // put price feed address
        log: true,
    })
}
