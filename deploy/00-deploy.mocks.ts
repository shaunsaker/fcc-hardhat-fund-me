import { network } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { developmentChains } from "../helper-hardhat-config"
import { MockV3Aggregator } from "../typechain"

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

    if (developmentChains.includes(chainId.toString())) {
        log("Local network detected! Deploying mocks...")

        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [],
        })
    }
}
