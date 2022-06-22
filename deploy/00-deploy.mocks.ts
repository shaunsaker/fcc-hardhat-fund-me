import { network } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import {
    DECIMALS,
    developmentChains,
    INITIAL_ETH_USD_PRICE,
} from "../helper-hardhat-config"
import { MockV3Aggregator } from "../typechain"

module.exports = async ({
    getNamedAccounts,
    deployments,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")

        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ETH_USD_PRICE],
        })

        log("Mocks deployed!")
        log("--------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
