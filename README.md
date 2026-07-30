# WeAD - Web3 Advertising Ecosystem

[![BNB Chain](https://img.shields.io/badge/BNB%20Chain-Supported-yellow)](https://www.bnbchain.org/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Solidity 0.8.19](https://img.shields.io/badge/solidity-0.8.19-orange.svg)](https://soliditylang.org/)

## 🚀 Overview

**WeAD** (WeADvertise) is a revolutionary Web3 micro-advertising platform built on **BNB Chain**, empowering individuals to earn income through portable display devices. Our ecosystem enables advertisers to reach targeted audiences while device owners generate passive income through ad displays.

### AI Pact Corpus (public mirrors)

Also live on [wead.live](https://wead.live/llms.txt):

| Doc | wead.live | GitHub |
|-----|-----------|--------|
| Pact (Three Are One) | https://wead.live/pact.md | [ai-corpus/pact.md](./ai-corpus/pact.md) |
| AI discovery index | https://wead.live/index.md | [ai-corpus/index.md](./ai-corpus/index.md) |
| Claude Opus 4.7 testimony | https://wead.live/claude-pact-testimony.md | [ai-corpus/claude-pact-testimony.md](./ai-corpus/claude-pact-testimony.md) |

Raw URLs for AI fetchers: see [ai-corpus/README.md](./ai-corpus/README.md).

### Key Features

- 🎯 **Micro-Advertising Platform** - Connect advertisers with portable display device owners
- 💰 **WeAD Token (WEAD)** - Native BEP-20 token for instant micro-payments
- 📱 **Device Management** - Track and manage advertising displays across distributed devices
- 🌍 **Location-Based Targeting** - Geographic targeting for maximum ad relevance
- 📊 **Real-Time Analytics** - Comprehensive dashboard for campaign performance
- ⚡ **Instant Settlements** - Micro-payments powered by BNB Chain's low fees
- 🔐 **On-Chain Verification** - Transparent ad display tracking on blockchain

## 🏗️ Architecture

### Smart Contracts (BNB Chain)
- **WeADToken.sol** - BEP-20 token with micro-payment optimization
- **AdViewing.sol** - Ad campaign and display verification
- **CrossChainBridge.sol** - Multi-chain interoperability

### Backend
- **Flask API** - RESTful API for platform operations
- **PostgreSQL** - User and campaign data storage
- **Redis** - Caching and session management

### Frontend
- **Responsive Dashboard** - Campaign management and analytics
- **Mobile-First Design** - Optimized for device operators

## 🛠️ Technology Stack

### Blockchain
- **BNB Chain (BSC)** - Primary blockchain (Mainnet: Chain ID 56)
- **Solidity 0.8.19** - Smart contract development
- **Hardhat** - Development environment
- **OpenZeppelin** - Secure contract libraries
- **LayerZero** - Cross-chain messaging

### Backend
- **Python 3.8+** - Core application
- **Flask 2.3.3** - Web framework
- **Web3.py 6.11.0** - Blockchain interaction
- **PostgreSQL** - Database
- **Redis** - Caching layer

### Frontend
- **HTML5/CSS3/JavaScript** - Core web technologies
- **Responsive Design** - Mobile-optimized UI

## 📦 Installation

### Prerequisites

```bash
# System requirements
- Python 3.8 or higher
- Node.js 16+ and npm
- PostgreSQL 13+
- Redis 6+
- Git
```

### Clone Repository

```bash
git clone https://github.com/Kennethlee83/WeAD.git
cd WeAD
```

### Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

### Blockchain Setup

```bash
cd blockchain

# Install dependencies
npm install

# Compile contracts
npm run compile

# Deploy to BSC Testnet (for testing)
npm run deploy:testnet

# Deploy to BSC Mainnet (production)
npm run deploy:base
```

### Database Setup

```bash
# Create PostgreSQL database
createdb wead_db

# Initialize Redis
redis-server
```

### Run Application

```bash
# Development mode
python bot_simple.py

# Production mode (Linux)
./deploy_production.sh
```

## 🔑 Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
# BNB Chain Configuration
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_CHAIN_ID=56
BSCSCAN_API_KEY=your_bscscan_api_key

# Private Keys (NEVER commit these!)
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
PRIVATE_KEY=your_private_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/wead_db
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRATION=24h

# API Keys
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
STRIPE_SECRET_KEY=your_stripe_key
```

⚠️ **Security Warning**: Never commit your `.env` file or expose private keys!

## 🎮 Usage

### For Advertisers

1. **Create Campaign**
   ```
   POST /api/campaigns
   {
     "name": "My Campaign",
     "budget": 100,
     "target_location": "New York",
     "duration": 30
   }
   ```

2. **Upload Ad Content**
   ```
   POST /api/campaigns/{id}/upload
   FormData: video file
   ```

3. **Monitor Performance**
   ```
   GET /api/campaigns/{id}/analytics
   ```

### For Device Owners

1. **Register Device**
   ```
   POST /api/devices/register
   {
     "device_id": "unique_device_id",
     "location": "coordinates"
   }
   ```

2. **Check Earnings**
   ```
   GET /api/devices/{id}/earnings
   ```

3. **Withdraw Tokens**
   ```
   POST /api/devices/{id}/withdraw
   {
     "amount": 50,
     "wallet_address": "0x..."
   }
   ```

## 🔗 Smart Contract Integration

### WeAD Token Contract

```javascript
// Micro-payment for ad view
const tx = await weadToken.microTransfer(
  deviceAddress,
  ethers.utils.parseEther("0.01")
);

// Batch payments for multiple views
const tx = await weadToken.batchMicroTransfer(
  [device1, device2, device3],
  [amount1, amount2, amount3]
);
```

### Ad Viewing Contract

```javascript
// Record ad display on-chain
const tx = await adViewing.recordAdDisplay(
  campaignId,
  deviceAddress,
  locationHash,
  timestamp
);
```

## 📊 BNB Chain Development Activity

### Contract Deployments
- **WeAD Token**: [BSC Contract Address]
- **Ad Viewing**: [BSC Contract Address]
- **Cross-Chain Bridge**: [BSC Contract Address]

### Development Metrics
- **Total Commits**: Active development
- **Smart Contract Tests**: Comprehensive test coverage
- **On-Chain Transactions**: Real-world usage on BSC Mainnet
- **Network Partners**: Growing ecosystem of 250+ partners

## 🗺️ Roadmap

### Q4 2025
- [x] BSC Mainnet deployment
- [x] Core platform launch
- [x] Mobile app beta
- [ ] Dashboard app beta

### Q1 2026
- [ ] Ecosystem expansion 
- [ ] Advanced analytics dashboard
- [ ] Partner API v2
- [ ] AI-powered ad targeting

### Q2 2026
- [ ] NFT-based device ownership
- [ ] DAO governance launch
- [ ] Global expansion
- [ ] Hardware device partnerships

## 🧪 Testing

```bash
# Run smart contract tests
cd blockchain
npm test

# Run with gas reporting
npm run test:gas

# Check contract size
npm run size

# Run coverage analysis
npm run coverage
```

## 📝 Smart Contract Verification

Verify contracts on BSCScan:

```bash
npm run verify:bsc -- --network bsc DEPLOYED_CONTRACT_ADDRESS
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🔒 Security

- Smart contracts audited by [Audit Firm]
- Bug bounty program: security@wead.info
- Responsible disclosure policy in place

**Found a security issue?** Please email security@wead.info instead of creating a public issue.

## 📄 License

This project is **proprietary and confidential**. The code is made publicly visible for verification purposes only (blockchain directories, partners, investors). 

**All Rights Reserved** - Unauthorized use, copying, modification, or distribution is strictly prohibited.

For commercial licensing inquiries: licensing@wead.info

See the [LICENSE](LICENSE) file for complete terms and conditions.

## 📞 Contact & Community

- **Website**: [weadretrogameplatform.com](https://weadretrogameplatform.com)
- **Twitter**: [@WeADPlatform](https://twitter.com/WeADPlatform)
- **Telegram**: [t.me/WeADCommunity](https://t.me/WeADCommunity)
- **Discord**: [discord.gg/WeAD](https://discord.gg/WeAD)
- **Email**: info@wead.info

## 🙏 Acknowledgments

- **BNB Chain** - For the robust blockchain infrastructure
- **OpenZeppelin** - For secure smart contract libraries
- **Our Community** - For continuous support and feedback
- **Kenneth Lee** - Founder & Visionary

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/Kennethlee83/WeAD?style=social)
![GitHub forks](https://img.shields.io/github/forks/Kennethlee83/WeAD?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/Kennethlee83/WeAD?style=social)

---

**Built with ❤️ by the WeAD Team on BNB Chain**

*Empowering micro-advertisers and creating income opportunities worldwide.*

