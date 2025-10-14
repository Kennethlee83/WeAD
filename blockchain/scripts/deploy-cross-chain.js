const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying WeAD Cross-Chain Infrastructure...");
  console.log("🌐 Target Networks: Base, Ethereum, Polygon, BSC, Avalanche, Arbitrum, Optimism");

  const networks = [
    { name: "Base", chainId: 8453, rpc: "https://mainnet.base.org" },
    { name: "Ethereum", chainId: 1, rpc: process.env.ETHEREUM_RPC_URL },
    { name: "Polygon", chainId: 137, rpc: "https://polygon-rpc.com" },
    { name: "BSC", chainId: 56, rpc: "https://bsc-dataseed.binance.org" },
    { name: "Avalanche", chainId: 43114, rpc: "https://api.avax.network/ext/bc/C/rpc" },
    { name: "Arbitrum", chainId: 42161, rpc: "https://arb1.arbitrum.io/rpc" },
    { name: "Optimism", chainId: 10, rpc: "https://mainnet.optimism.io" }
  ];

  const deployments = {};
  const [deployer] = await ethers.getSigners();

  console.log(`📝 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

  // Deploy to Base first (primary chain)
  console.log("\n🏠 Deploying to Base (Primary Chain)...");
  const baseDeployment = await deployToNetwork("base", networks[0]);
  deployments.base = baseDeployment;

  // Deploy to other networks
  for (let i = 1; i < networks.length; i++) {
    const network = networks[i];
    console.log(`\n🌐 Deploying to ${network.name}...`);

    try {
      const deployment = await deployToNetwork(network.name.toLowerCase(), network);
      deployments[network.name.toLowerCase()] = deployment;
    } catch (error) {
      console.error(`❌ Failed to deploy to ${network.name}:`, error.message);
      deployments[network.name.toLowerCase()] = { error: error.message };
    }
  }

  // Setup cross-chain configurations
  console.log("\n🔗 Setting up Cross-Chain Configurations...");
  await setupCrossChainConfigurations(deployments);

  // Generate deployment report
  console.log("\n📊 Generating Deployment Report...");
  generateDeploymentReport(deployments);

  console.log("\n🎉 Cross-Chain Deployment Complete!");
  console.log("📋 Check deployments/cross-chain-report.json for details");
}

async function deployToNetwork(networkName, networkConfig) {
  try {
    // Set network in Hardhat
    await hre.network.provider.send("hardhat_reset");

    // Deploy WEAD Token
    console.log(`   📄 Deploying WEAD Token to ${networkName}...`);
    const WeADToken = await ethers.getContractFactory("WeADToken");

    // Different constructor params for different networks
    let tokenDeployment;
    if (networkName === "base") {
      // Base gets the cross-chain bridge address after deployment
      tokenDeployment = await WeADToken.deploy(
        process.env.DEPLOYER_ADDRESS || (await ethers.getSigners())[0].address,
        ethers.constants.AddressZero // Bridge address will be updated
      );
    } else {
      // Other networks use Base bridge as cross-chain bridge
      tokenDeployment = await WeADToken.deploy(
        process.env.DEPLOYER_ADDRESS || (await ethers.getSigners())[0].address,
        process.env.BASE_BRIDGE_ADDRESS || ethers.constants.AddressZero
      );
    }

    await tokenDeployment.deployed();
    console.log(`   ✅ WEAD Token: ${tokenDeployment.address}`);

    // Deploy Ad Viewing Contract
    console.log(`   📺 Deploying Ad Viewing Contract to ${networkName}...`);
    const AdViewing = await ethers.getContractFactory("AdViewing");
    const adViewingDeployment = await AdViewing.deploy(
      tokenDeployment.address,
      ethers.constants.AddressZero // Bridge address will be updated
    );
    await adViewingDeployment.deployed();
    console.log(`   ✅ Ad Viewing: ${adViewingDeployment.address}`);

    // Deploy Cross-Chain Bridge (only on Base)
    let bridgeDeployment = null;
    if (networkName === "base") {
      console.log(`   🌉 Deploying Cross-Chain Bridge to ${networkName}...`);
      const CrossChainBridge = await ethers.getContractFactory("CrossChainBridge");
      bridgeDeployment = await CrossChainBridge.deploy(
        tokenDeployment.address,
        adViewingDeployment.address,
        "0x1a44076050125825900e736c501f859c50fE728c" // Base LayerZero endpoint
      );
      await bridgeDeployment.deployed();
      console.log(`   ✅ Cross-Chain Bridge: ${bridgeDeployment.address}`);
    }

    // Update contract references
    if (bridgeDeployment) {
      console.log(`   🔄 Updating contract references on ${networkName}...`);

      await tokenDeployment.setCrossChainBridge(bridgeDeployment.address);
      console.log(`   ✅ Updated WEAD Token with bridge address`);

      await adViewingDeployment.setCrossChainBridge(bridgeDeployment.address);
      console.log(`   ✅ Updated Ad Viewing with bridge address`);
    }

    // Configure chain mappings for cross-chain bridge
    if (bridgeDeployment) {
      console.log(`   🗺️ Configuring chain mappings on ${networkName}...`);

      const chainMappings = [
        { chainId: 1, lzId: 101 },     // Ethereum
        { chainId: 137, lzId: 109 },   // Polygon
        { chainId: 56, lzId: 102 },    // BSC
        { chainId: 43114, lzId: 106 }, // Avalanche
        { chainId: 42161, lzId: 110 }, // Arbitrum
        { chainId: 10, lzId: 111 },    // Optimism
        { chainId: 8453, lzId: 184 },  // Base
      ];

      for (const mapping of chainMappings) {
        await bridgeDeployment.addChainMapping(mapping.chainId, mapping.lzId);
      }
      console.log(`   ✅ Configured ${chainMappings.length} chain mappings`);
    }

    // Mint initial supply
    console.log(`   💰 Minting initial WEAD supply on ${networkName}...`);
    const initialSupply = ethers.utils.parseEther("1000000"); // 1M WEAD
    await tokenDeployment.mint(
      process.env.DEPLOYER_ADDRESS || (await ethers.getSigners())[0].address,
      initialSupply
    );
    console.log(`   ✅ Minted 1,000,000 WEAD tokens`);

    return {
      network: networkName,
      chainId: networkConfig.chainId,
      contracts: {
        WeADToken: {
          address: tokenDeployment.address,
          supply: ethers.utils.formatEther(initialSupply)
        },
        AdViewing: {
          address: adViewingDeployment.address
        },
        CrossChainBridge: bridgeDeployment ? {
          address: bridgeDeployment.address
        } : null
      },
      deployer: process.env.DEPLOYER_ADDRESS || (await ethers.getSigners())[0].address,
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber()
    };

  } catch (error) {
    console.error(`❌ Deployment failed on ${networkName}:`, error);
    throw error;
  }
}

async function setupCrossChainConfigurations(deployments) {
  try {
    const baseDeployment = deployments.base;

    if (!baseDeployment || !baseDeployment.contracts.CrossChainBridge) {
      console.log("⚠️ Base deployment incomplete, skipping cross-chain setup");
      return;
    }

    console.log("🔧 Setting up cross-chain configurations...");

    // Configure bridge fees for each chain
    const chainFees = {
      1: ethers.utils.parseEther("0.001"),     // Ethereum: 0.001 ETH
      137: ethers.utils.parseEther("0.0001"),  // Polygon: 0.0001 ETH
      56: ethers.utils.parseEther("0.0002"),   // BSC: 0.0002 ETH
      43114: ethers.utils.parseEther("0.0003"), // Avalanche: 0.0003 ETH
      42161: ethers.utils.parseEther("0.0001"), // Arbitrum: 0.0001 ETH
      10: ethers.utils.parseEther("0.0001"),   // Optimism: 0.0001 ETH
    };

    // Set fees on Base bridge
    const bridgeAddress = baseDeployment.contracts.CrossChainBridge.address;
    const CrossChainBridge = await ethers.getContractFactory("CrossChainBridge");
    const bridge = CrossChainBridge.attach(bridgeAddress);

    for (const [chainId, fee] of Object.entries(chainFees)) {
      await bridge.setChainSpecificFee(chainId, fee);
      console.log(`   ✅ Set bridge fee for chain ${chainId}: ${ethers.utils.formatEther(fee)} ETH`);
    }

    console.log("✅ Cross-chain configurations complete");

  } catch (error) {
    console.error("❌ Failed to setup cross-chain configurations:", error);
  }
}

function generateDeploymentReport(deployments) {
  const report = {
    deployment: {
      timestamp: new Date().toISOString(),
      networks: Object.keys(deployments).length,
      status: "completed"
    },
    networks: {},
    summary: {
      totalContracts: 0,
      successfulDeployments: 0,
      failedDeployments: 0
    }
  };

  for (const [networkName, deployment] of Object.entries(deployments)) {
    if (deployment.error) {
      report.networks[networkName] = {
        status: "failed",
        error: deployment.error
      };
      report.summary.failedDeployments++;
    } else {
      report.networks[networkName] = {
        status: "success",
        chainId: deployment.chainId,
        contracts: deployment.contracts,
        blockNumber: deployment.blockNumber
      };
      report.summary.successfulDeployments++;
      report.summary.totalContracts += Object.keys(deployment.contracts).length;
    }
  }

  // Save report
  const fs = require('fs');
  fs.writeFileSync(
    './blockchain/deployments/cross-chain-report.json',
    JSON.stringify(report, null, 2)
  );

  console.log("📋 Deployment Report Generated:");
  console.log(`   ✅ Successful: ${report.summary.successfulDeployments}`);
  console.log(`   ❌ Failed: ${report.summary.failedDeployments}`);
  console.log(`   📄 Total Contracts: ${report.summary.totalContracts}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Cross-chain deployment failed:", error);
    process.exit(1);
  });

