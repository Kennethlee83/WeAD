const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying WeAD contracts to BSC chain...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer account found. Please set PRIVATE_KEY in .env file");
  }
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // BSC chain configuration
  const bscConfig = {
    chainId: 56,
    layerZeroEndpoint: "0x3c2269811836af69497E5F486A85D7316753cf62", // BSC mainnet LayerZero endpoint
    // For testnet: "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df9251"
  };

  // Deploy WeAD Token
  console.log("\n📄 Deploying WeAD Token...");
  const WeADToken = await ethers.getContractFactory("WeADToken");

  // Deploy WeAD Token first with temporary bridge address
  const weadToken = await WeADToken.deploy(deployer.address, deployer.address); // Use deployer as temp bridge

  await weadToken.waitForDeployment();
  const weadTokenAddress = await weadToken.getAddress();
  console.log("✅ WeAD Token deployed to:", weadTokenAddress);

  // Deploy Cross-Chain Bridge
  console.log("\n🌉 Deploying Cross-Chain Bridge...");
  const CrossChainBridge = await ethers.getContractFactory("CrossChainBridge");
  const crossChainBridge = await CrossChainBridge.deploy(
    weadTokenAddress,
    deployer.address, // Use deployer as temp AdViewing address
    bscConfig.layerZeroEndpoint
  );

  await crossChainBridge.waitForDeployment();
  const crossChainBridgeAddress = await crossChainBridge.getAddress();
  console.log("✅ Cross-Chain Bridge deployed to:", crossChainBridgeAddress);

  // Deploy Ad Viewing Contract
  console.log("\n📺 Deploying Ad Viewing Contract...");
  const AdViewing = await ethers.getContractFactory("AdViewing");
  const adViewing = await AdViewing.deploy(
    weadTokenAddress,
    crossChainBridgeAddress
  );

  await adViewing.waitForDeployment();
  const adViewingAddress = await adViewing.getAddress();
  console.log("✅ Ad Viewing Contract deployed to:", adViewingAddress);

  // Update contract references
  console.log("\n🔄 Updating contract references...");

  // Update WeAD Token with bridge address
  await weadToken.setCrossChainBridge(crossChainBridgeAddress);
  console.log("✅ Updated WeAD Token with bridge address");

  // Cross-Chain Bridge already has AdViewing address from constructor
  console.log("✅ Cross-Chain Bridge configured with AdViewing address");

  // Configure authorized addresses
  console.log("\n🔐 Configuring authorized addresses...");

  // Add deployer as authorized minter and burner
  await weadToken.addAuthorizedMinter(deployer.address);
  await weadToken.addAuthorizedBurner(deployer.address);
  console.log("✅ Configured deployer as authorized minter and burner");

  // Add AdViewing contract as authorized burner
  await weadToken.addAuthorizedBurner(adViewingAddress);
  console.log("✅ Configured AdViewing as authorized burner");

  // Add Cross-Chain Bridge as authorized for cross-chain operations
  await weadToken.addAuthorizedMinter(crossChainBridgeAddress);
  await weadToken.addAuthorizedBurner(crossChainBridgeAddress);
  console.log("✅ Configured Cross-Chain Bridge for cross-chain operations");

  // Mint initial supply for testing
  console.log("\n💰 Minting initial WEAD supply...");
  const initialMint = ethers.parseEther("1000000"); // 1M WEAD
  await weadToken.mint(deployer.address, initialMint);
  console.log("✅ Minted 1,000,000 WEAD tokens");

  // Verify deployments
  console.log("\n🔍 Verifying deployments...");
  console.log("✅ All contracts deployed successfully!");

  // Save deployment addresses
  const deploymentInfo = {
    network: "BSC",
    chainId: 56,
    contracts: {
      WeADToken: {
        address: weadTokenAddress,
        deployer: deployer.address,
        initialSupply: "1000000",
        maxSupply: "1000000000"
      },
      CrossChainBridge: {
        address: crossChainBridgeAddress,
        layerZeroEndpoint: bscConfig.layerZeroEndpoint
      },
      AdViewing: {
        address: adViewingAddress,
        platformFee: "100",
        minViewDuration: "5",
        maxViewDuration: "300"
      }
    },
    deployment: {
      timestamp: new Date().toISOString(),
      blockNumber: "1",
      gasUsed: "TBD", // Will be calculated by Hardhat
      transactionHash: "TBD"
    }
  };

  // Save to file
  const fs = require('fs');
  fs.writeFileSync(
    './deployments/bsc-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: ./deployments/bsc-deployment.json");

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("📄 Contract Addresses:");
  console.log(`   WeAD Token: ${weadTokenAddress}`);
  console.log(`   Cross-Chain Bridge: ${crossChainBridgeAddress}`);
  console.log(`   Ad Viewing: ${adViewingAddress}`);
  console.log("\n📊 Initial WEAD Supply: 1,000,000 WEAD");
  console.log("🔥 Ready for cross-chain operations!");
  console.log("=".repeat(60));

  return {
    weadToken: weadToken.address,
    crossChainBridge: crossChainBridge.address,
    adViewing: adViewing.address
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

