/**
 * WeAD Platform - Network Configuration
 * Toggle between Testnet (free testing) and Mainnet (production)
 */

// ============================================
// TOGGLE THIS TO SWITCH NETWORKS
// ============================================
const IS_PRODUCTION = true; // Set to TRUE for mainnet, FALSE for testnet

// ============================================
// TESTNET Configuration (Current)
// ============================================
const TESTNET_CONFIG = {
    WEAD_TOKEN_ADDRESS: '0xCF99bF2cbD83A580437d39A5092C1665Faa9898B',
    CROSS_CHAIN_BRIDGE: '0x58a5cf62179d26Ec090B0A37E11cD861dE3Bc5ac',
    AD_VIEWING_ADDRESS: '0x7C38b667888661bE70267E2b90CeE75029384B02',
    PLATFORM_WALLET: '0x01d3829a1b0CA3E1390724a0C5C419435720431e',
    
    BSC_CONFIG: {
        chainId: '0x61', // 97 in hex
        chainName: 'BSC Testnet',
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
        },
        rpcUrls: [
            'https://data-seed-prebsc-1-s1.binance.org:8545/',
            'https://data-seed-prebsc-2-s1.binance.org:8545/'
        ],
        blockExplorerUrls: ['https://testnet.bscscan.com']
    },
    
    EXPLORER_URL: 'https://testnet.bscscan.com',
    NETWORK_NAME: 'BSC Testnet',
    IS_TESTNET: true
};

// ============================================
// MAINNET Configuration (Current)
// ============================================
const MAINNET_CONFIG = {
    WEAD_TOKEN_ADDRESS: '0xCF99bF2cbD83A580437d39A5092C1665Faa9898B',
    CROSS_CHAIN_BRIDGE: '0x58a5cf62179d26Ec090B0A37E11cD861dE3Bc5ac',
    AD_VIEWING_ADDRESS: '0xTODO_DEPLOY_LATER', // Will deploy when more BNB added
    PLATFORM_WALLET: '0x01d3829a1b0CA3E1390724a0C5C419435720431e',
    
    BSC_CONFIG: {
        chainId: '0x38', // 56 in hex
        chainName: 'BSC Mainnet',
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
        },
        rpcUrls: [
            'https://bsc-dataseed.binance.org/',
            'https://bsc-dataseed1.defibit.io/',
            'https://bsc-dataseed1.ninicoin.io/'
        ],
        blockExplorerUrls: ['https://bscscan.com']
    },
    
    EXPLORER_URL: 'https://bscscan.com',
    NETWORK_NAME: 'BSC Mainnet',
    IS_TESTNET: false
};

// ============================================
// Active Configuration (Auto-Selected)
// ============================================
const CONFIG = IS_PRODUCTION ? MAINNET_CONFIG : TESTNET_CONFIG;

// Export for use in all pages
window.WEAD_CONFIG = CONFIG;
window.IS_PRODUCTION = IS_PRODUCTION;

// Helper function to get explorer link
window.getExplorerLink = function(txHash) {
    return `${CONFIG.EXPLORER_URL}/tx/${txHash}`;
};

window.getAddressLink = function(address) {
    return `${CONFIG.EXPLORER_URL}/address/${address}`;
};

window.getTokenLink = function(tokenAddress, holderAddress) {
    return `${CONFIG.EXPLORER_URL}/token/${tokenAddress}?a=${holderAddress}`;
};

// Log current configuration
console.log(`🌐 WeAD Platform Configuration:`);
console.log(`   Network: ${CONFIG.NETWORK_NAME}`);
console.log(`   Mode: ${IS_PRODUCTION ? '🔴 PRODUCTION' : '🟢 TESTNET'}`);
console.log(`   WEAD Token: ${CONFIG.WEAD_TOKEN_ADDRESS}`);
console.log(`   Chain ID: ${CONFIG.BSC_CONFIG.chainId}`);

if (CONFIG.IS_TESTNET) {
    console.log(`   ⚠️  Using TESTNET - No real money involved`);
} else {
    console.log(`   💰 Using MAINNET - Real money transactions!`);
}

