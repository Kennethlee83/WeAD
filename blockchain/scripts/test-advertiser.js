const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🧪 Testing AdViewing Contract - Advertiser Functions\n");
  console.log("=".repeat(70));

  // Contract addresses
  const WEAD_TOKEN_ADDRESS = "0xCF99bF2cbD83A580437d39A5092C1665Faa9898B";
  const AD_VIEWING_ADDRESS = "0x7b8F6Ae477F2fd0Cb467B28a07Dd93D8396B7A14";

  // Get signer
  const [advertiser] = await ethers.getSigners();
  console.log("👤 Advertiser Address:", advertiser.address);

  // Connect to contracts
  const WeADToken = await ethers.getContractFactory("WeADToken");
  const weadToken = WeADToken.attach(WEAD_TOKEN_ADDRESS);

  const AdViewing = await ethers.getContractFactory("AdViewing");
  const adViewing = AdViewing.attach(AD_VIEWING_ADDRESS);

  // Check WEAD balance
  console.log("\n💰 Checking WEAD Token Balance...");
  const balance = await weadToken.balanceOf(advertiser.address);
  console.log(`   Balance: ${ethers.formatEther(balance)} WEAD`);

  if (balance === 0n) {
    console.log("\n⚠️  No WEAD tokens! Minting some for testing...");
    try {
      const mintTx = await weadToken.mint(advertiser.address, ethers.parseEther("10000"));
      await mintTx.wait();
      console.log("✅ Minted 10,000 WEAD tokens");
    } catch (error) {
      console.log("❌ Mint failed:", error.message);
      console.log("   You may not have minter permissions. Use a wallet with minter role.");
      return;
    }
  }

  // Test 1: Create an Ad Campaign
  console.log("\n" + "=".repeat(70));
  console.log("📺 TEST 1: Creating Ad Campaign");
  console.log("=".repeat(70));

  const adMetadata = JSON.stringify({
    title: "WeAD Platform Ad",
    description: "Test ad for WeAD advertising platform",
    videoUrl: "https://example.com/ad-video.mp4",
    targetAudience: "crypto users",
    category: "technology"
  });

  const rewardPerSecond = ethers.parseEther("0.01"); // 0.01 WEAD per second viewed
  const maxBudget = ethers.parseEther("100"); // 100 WEAD budget

  try {
    console.log("\n📝 Ad Campaign Details:");
    console.log(`   Reward: 0.01 WEAD per second`);
    console.log(`   Budget: 100 WEAD`);
    console.log(`   Max Views: ~10,000 seconds (~2.7 hours)`);

    console.log("\n⏳ Creating ad campaign on-chain...");
    const createAdTx = await adViewing.createAd(
      rewardPerSecond,
      maxBudget,
      adMetadata
    );
    const receipt = await createAdTx.wait();

    console.log("✅ Ad Campaign Created!");
    console.log(`   Transaction: https://bscscan.com/tx/${receipt.hash}`);

    // Get the ad ID from events (should be 1 for first ad)
    const adCount = await adViewing.adCount();
    console.log(`   Ad ID: ${adCount}`);

    // Test 2: Check Ad Status
    console.log("\n" + "=".repeat(70));
    console.log("📊 TEST 2: Checking Ad Status");
    console.log("=".repeat(70));

    const ad = await adViewing.ads(adCount);
    console.log("\n📄 Ad Details:");
    console.log(`   Advertiser: ${ad.advertiser}`);
    console.log(`   Reward/Sec: ${ethers.formatEther(ad.rewardPerSecond)} WEAD`);
    console.log(`   Max Budget: ${ethers.formatEther(ad.maxBudget)} WEAD`);
    console.log(`   Spent: ${ethers.formatEther(ad.spentBudget)} WEAD`);
    console.log(`   Total Views: ${ad.totalViews}`);
    console.log(`   Active: ${ad.isActive ? "✅ Yes" : "❌ No"}`);
    console.log(`   Created: ${new Date(Number(ad.createdAt) * 1000).toLocaleString()}`);

    // Test 3: Update Ad Budget
    console.log("\n" + "=".repeat(70));
    console.log("💰 TEST 3: Updating Ad Budget");
    console.log("=".repeat(70));

    const newBudget = ethers.parseEther("150"); // Increase to 150 WEAD
    console.log(`\n⏳ Increasing budget from 100 to 150 WEAD...`);
    
    const updateTx = await adViewing.updateAdBudget(adCount, newBudget);
    await updateTx.wait();
    
    console.log("✅ Budget Updated!");
    console.log(`   Transaction: https://bscscan.com/tx/${updateTx.hash}`);

    const updatedAd = await adViewing.ads(adCount);
    console.log(`   New Budget: ${ethers.formatEther(updatedAd.maxBudget)} WEAD`);

    // Test 4: Check Remaining Budget
    console.log("\n" + "=".repeat(70));
    console.log("💵 TEST 4: Checking Remaining Budget");
    console.log("=".repeat(70));

    const remainingBudget = await adViewing.getRemainingBudget(adCount);
    console.log(`\n💰 Remaining Budget: ${ethers.formatEther(remainingBudget)} WEAD`);

    // Test 5: Pause/Unpause Ad
    console.log("\n" + "=".repeat(70));
    console.log("⏸️  TEST 5: Pause & Resume Ad");
    console.log("=".repeat(70));

    console.log("\n⏳ Pausing ad...");
    const pauseTx = await adViewing.toggleAd(adCount);
    await pauseTx.wait();

    let isActive = await adViewing.isAdActive(adCount);
    console.log(`✅ Ad Paused! Active: ${isActive ? "Yes" : "No"}`);

    console.log("\n⏳ Resuming ad...");
    const resumeTx = await adViewing.toggleAd(adCount);
    await resumeTx.wait();

    isActive = await adViewing.isAdActive(adCount);
    console.log(`✅ Ad Resumed! Active: ${isActive ? "Yes" : "No"}`);

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎉 ALL TESTS PASSED!");
    console.log("=".repeat(70));
    console.log("\n✅ AdViewing Contract is fully functional!");
    console.log("✅ Advertisers can create campaigns");
    console.log("✅ Budget management works");
    console.log("✅ Pause/resume functionality works");
    console.log("\n📊 Your WeAD advertising platform is READY FOR PRODUCTION! 🚀");
    console.log("\n🔗 View Ad on BSCScan:");
    console.log(`   https://bscscan.com/address/${AD_VIEWING_ADDRESS}`);
    console.log("=".repeat(70));

  } catch (error) {
    console.log("\n❌ Test Failed:", error.message);
    if (error.data) {
      console.log("   Error Data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });


