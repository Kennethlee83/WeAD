const hre = require("hardhat");

async function main() {
    console.log("🪙 Minting additional WEAD tokens on BSC Mainnet...");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Get deployed WEAD Token contract
    const WEAD_TOKEN_ADDRESS = "0xCF99bF2cbD83A580437d39A5092C1665Faa9898B";
    const WeADToken = await hre.ethers.getContractAt("WeADToken", WEAD_TOKEN_ADDRESS);
    
    console.log("📄 WEAD Token contract:", WEAD_TOKEN_ADDRESS);
    
    // Check current supply
    const currentSupply = await WeADToken.totalSupply();
    const maxSupply = await WeADToken.MAX_SUPPLY();
    console.log(`💰 Current Supply: ${hre.ethers.formatEther(currentSupply)} WEAD`);
    console.log(`🎯 Max Supply: ${hre.ethers.formatEther(maxSupply)} WEAD`);
    
    const remainingToMint = maxSupply - currentSupply;
    console.log(`📈 Can mint: ${hre.ethers.formatEther(remainingToMint)} WEAD more`);
    
    // Step 1: Authorize deployer as minter
    console.log("\n🔐 Step 1: Authorizing minter...");
    const authTx = await WeADToken.addAuthorizedMinter(deployer.address);
    await authTx.wait();
    console.log("✅ Minter authorized!");
    
    // Step 2: Mint remaining tokens (900 million)
    console.log("\n💎 Step 2: Minting 900,000,000 WEAD tokens...");
    const amountToMint = hre.ethers.parseEther("900000000"); // 900 million
    const mintTx = await WeADToken.mint(deployer.address, amountToMint);
    await mintTx.wait();
    console.log("✅ Tokens minted!");
    
    // Check new supply
    const newSupply = await WeADToken.totalSupply();
    console.log(`\n🎉 New Total Supply: ${hre.ethers.formatEther(newSupply)} WEAD`);
    console.log(`💰 Your Balance: ${hre.ethers.formatEther(await WeADToken.balanceOf(deployer.address))} WEAD`);
    
    console.log("\n✅ COMPLETE! You now have 1 BILLION WEAD tokens on BSC Mainnet!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Minting failed:", error);
        process.exit(1);
    });




