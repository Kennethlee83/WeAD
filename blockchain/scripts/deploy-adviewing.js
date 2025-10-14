const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying AdViewing Contract to BSC...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "BNB\n");

  // Use existing deployed contract addresses
  const WEAD_TOKEN_ADDRESS = "0xCF99bF2cbD83A580437d39A5092C1665Faa9898B";
  const CROSS_CHAIN_BRIDGE_ADDRESS = "0x58a5cf62179d26Ec090B0A37E11cD861dE3Bc5ac";

  console.log("📄 Using existing contracts:");
  console.log(`   WEAD Token: ${WEAD_TOKEN_ADDRESS}`);
  console.log(`   Bridge: ${CROSS_CHAIN_BRIDGE_ADDRESS}\n`);

  // Deploy Ad Viewing Contract
  console.log("📺 Deploying Ad Viewing Contract...");
  const AdViewing = await ethers.getContractFactory("AdViewing");
  
  const adViewing = await AdViewing.deploy(
    WEAD_TOKEN_ADDRESS,
    CROSS_CHAIN_BRIDGE_ADDRESS
  );

  await adViewing.waitForDeployment();
  const adViewingAddress = await adViewing.getAddress();
  console.log("✅ Ad Viewing Contract deployed to:", adViewingAddress);
  console.log("   View on BSCScan: https://bscscan.com/address/" + adViewingAddress);

  // Get WEAD Token contract
  console.log("\n🔄 Configuring permissions...");
  const WeADToken = await ethers.getContractFactory("WeADToken");
  const weadToken = WeADToken.attach(WEAD_TOKEN_ADDRESS);

  try {
    // Add AdViewing contract as authorized burner (for paying rewards)
    const tx1 = await weadToken.addAuthorizedBurner(adViewingAddress);
    await tx1.wait();
    console.log("✅ Configured AdViewing as authorized burner");
  } catch (error) {
    console.log("⚠️  Burner already configured or permission denied:", error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    network: "BSC Mainnet",
    chainId: 56,
    timestamp: new Date().toISOString(),
    contracts: {
      WeADToken: {
        address: WEAD_TOKEN_ADDRESS,
        status: "Existing - No changes"
      },
      CrossChainBridge: {
        address: CROSS_CHAIN_BRIDGE_ADDRESS,
        status: "Existing - No changes"
      },
      AdViewing: {
        address: adViewingAddress,
        status: "Newly Deployed",
        platformFee: "500", // 5% in basis points
        minViewDuration: "5", // seconds
        maxViewDuration: "300" // seconds
      }
    },
    deployer: deployer.address,
    transactionHash: adViewing.deploymentTransaction().hash
  };

  // Save to file
  const fs = require('fs');
  const path = require('path');
  
  // Ensure deployments directory exists
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, 'bsc-deployment.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: ./deployments/bsc-deployment.json");

  // Print summary
  console.log("\n" + "=".repeat(70));
  console.log("🎉 ADVIEWING CONTRACT DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));
  console.log("\n📄 Contract Addresses:");
  console.log(`   WEAD Token:         ${WEAD_TOKEN_ADDRESS}`);
  console.log(`   Cross-Chain Bridge: ${CROSS_CHAIN_BRIDGE_ADDRESS}`);
  console.log(`   ⭐ AdViewing:       ${adViewingAddress}`);
  console.log("\n📊 AdViewing Configuration:");
  console.log("   Platform Fee: 5%");
  console.log("   Min View Duration: 5 seconds");
  console.log("   Max View Duration: 300 seconds (5 minutes)");
  console.log("\n🔗 Verify on BSCScan:");
  console.log(`   https://bscscan.com/address/${adViewingAddress}`);
  console.log("\n✅ Your WeAD advertising platform is now COMPLETE!");
  console.log("   Advertisers can now create campaigns on-chain! 🎯");
  console.log("=".repeat(70) + "\n");

  return {
    weadToken: WEAD_TOKEN_ADDRESS,
    crossChainBridge: CROSS_CHAIN_BRIDGE_ADDRESS,
    adViewing: adViewingAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });


