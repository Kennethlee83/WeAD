// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title WeAD Token
 * @dev WEAD token for micro-advertising platform on Base chain
 * Optimized for micro-payments with cross-chain capabilities
 */
contract WeADToken is ERC20, ERC20Burnable, Pausable, Ownable, ReentrancyGuard {
    // Events
    event MicroPayment(address indexed from, address indexed to, uint256 amount);
    event InstantTransferEvent(address indexed from, address indexed to, uint256 amount, bytes32 transferId);
    event CrossChainTransfer(address indexed from, address indexed to, uint256 amount, uint256 chainId);
    event AdRewardPaid(address indexed advertiser, address indexed viewer, uint256 amount, uint256 adId);
    event PublicAdDisplayed(address indexed device, address indexed advertiser, uint256 adId, bytes32 displayHash, uint256 timestamp);
    event TokenSwap(address indexed from, address indexed to, uint256 weadAmount, uint256 ethAmount, uint256 rate);

    // Constants
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion WEAD
    uint256 public constant MICRO_PAYMENT_MIN = 10**15; // 0.001 WEAD minimum
    uint256 public constant BURN_RATE = 1; // 0.01% burn on transfers

    // State variables
    mapping(address => bool) public authorizedMinters;
    mapping(address => bool) public authorizedBurners;
    mapping(address => bool) public authorizedDevices;
    mapping(bytes32 => bool) public processedCrossChainMessages;
    mapping(bytes32 => PublicAdDisplay) public publicAdDisplays;
    mapping(address => uint256) public lastTransferTime;

    // Instant transfer tracking
    mapping(bytes32 => InstantTransfer) public instantTransfers;
    uint256 public transferCount;

    // Public display tracking
    mapping(address => uint256[]) public deviceAdDisplays;
    uint256 public displayCount;

    // Swap functionality
    uint256 public swapRate = 1000; // WEAD per ETH (initially 1000 WEAD = 1 ETH)
    bool public swapEnabled = true;
    uint256 public totalSwapped;

    struct InstantTransfer {
        address from;
        address to;
        uint256 amount;
        bytes32 transferId;
        uint256 timestamp;
        bool completed;
    }

    struct PublicAdDisplay {
        address device;
        address advertiser;
        uint256 adId;
        bytes32 displayHash;
        uint256 timestamp;
        uint256 locationHash;
        uint256 rewardAmount;
        bool verified;
    }

    // Cross-chain variables
    address public crossChainBridge;
    uint256 public currentChainId;

    constructor(
        address _initialOwner,
        address _crossChainBridge
    ) ERC20("WeAD Token", "WEAD") {
        require(_initialOwner != address(0), "Invalid owner address");
        require(_crossChainBridge != address(0), "Invalid bridge address");

        _transferOwnership(_initialOwner);
        crossChainBridge = _crossChainBridge;
        currentChainId = block.chainid;

        // Mint initial supply to owner
        _mint(_initialOwner, 100_000_000 * 10**18); // 100 million WEAD
    }

    /**
     * @dev Optimized micro-payment function for ad rewards
     */
    function microTransfer(
        address to,
        uint256 amount
    ) external whenNotPaused nonReentrant returns (bool) {
        require(amount >= MICRO_PAYMENT_MIN, "Amount too small");
        require(amount <= balanceOf(_msgSender()), "Insufficient balance");
        require(to != address(0), "Invalid recipient");

        // Burn small percentage to maintain token value
        uint256 burnAmount = (amount * BURN_RATE) / 10000;
        uint256 transferAmount = amount - burnAmount;

        // Transfer tokens
        _transfer(_msgSender(), to, transferAmount);

        // Burn tokens
        if (burnAmount > 0) {
            _burn(_msgSender(), burnAmount);
        }

        // Update last transfer time for rate limiting
        lastTransferTime[_msgSender()] = block.timestamp;

        emit MicroPayment(_msgSender(), to, transferAmount);
        return true;
    }

    /**
     * @dev Batch micro-payments for multiple ad views
     */
    function batchMicroTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external whenNotPaused nonReentrant returns (bool) {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0 && recipients.length <= 100, "Invalid batch size");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] >= MICRO_PAYMENT_MIN, "Amount too small");
            require(recipients[i] != address(0), "Invalid recipient");
            totalAmount += amounts[i];
        }

        require(totalAmount <= balanceOf(_msgSender()), "Insufficient balance");

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 burnAmount = (amounts[i] * BURN_RATE) / 10000;
            uint256 transferAmount = amounts[i] - burnAmount;

            _transfer(_msgSender(), recipients[i], transferAmount);

            if (burnAmount > 0) {
                _burn(_msgSender(), burnAmount);
            }

            emit MicroPayment(_msgSender(), recipients[i], transferAmount);
        }

        lastTransferTime[_msgSender()] = block.timestamp;
        return true;
    }

    /**
     * @dev Cross-chain transfer function
     */
    function crossChainTransfer(
        address to,
        uint256 amount,
        uint256 destinationChainId,
        bytes32 messageId
    ) external whenNotPaused nonReentrant returns (bool) {
        require(amount >= MICRO_PAYMENT_MIN, "Amount too small");
        require(amount <= balanceOf(_msgSender()), "Insufficient balance");
        require(to != address(0), "Invalid recipient");
        require(destinationChainId != currentChainId, "Same chain transfer");
        require(!processedCrossChainMessages[messageId], "Message already processed");

        // Burn tokens on source chain
        _burn(_msgSender(), amount);

        // Mark message as processed
        processedCrossChainMessages[messageId] = true;

        emit CrossChainTransfer(_msgSender(), to, amount, destinationChainId);
        return true;
    }

    /**
     * @dev Receive cross-chain transfer
     */
    function receiveCrossChainTransfer(
        address to,
        uint256 amount,
        bytes32 messageId
    ) external onlyAuthorizedBridge nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(!processedCrossChainMessages[messageId], "Message already processed");

        // Mint tokens on destination chain
        _mint(to, amount);
        processedCrossChainMessages[messageId] = true;

        emit CrossChainTransfer(address(0), to, amount, currentChainId);
    }

    /**
     * @dev Pay ad reward to viewer
     */
    function payAdReward(
        address advertiser,
        address viewer,
        uint256 amount,
        uint256 adId
    ) external onlyAuthorizedBurners whenNotPaused nonReentrant returns (bool) {
        require(amount >= MICRO_PAYMENT_MIN, "Amount too small");
        require(amount <= balanceOf(advertiser), "Insufficient balance");
        require(viewer != address(0), "Invalid viewer");
        require(advertiser != address(0), "Invalid advertiser");

        _transfer(advertiser, viewer, amount);

        emit AdRewardPaid(advertiser, viewer, amount, adId);
        return true;
    }

    /**
     * @dev Instant transfer for immediate payments
     */
    function instantTransfer(
        address to,
        uint256 amount
    ) external whenNotPaused nonReentrant returns (bytes32) {
        require(amount >= MICRO_PAYMENT_MIN, "Amount too small");
        require(amount <= balanceOf(_msgSender()), "Insufficient balance");
        require(to != address(0), "Invalid recipient");

        transferCount++;
        bytes32 transferId = keccak256(abi.encodePacked(
            _msgSender(),
            to,
            amount,
            transferCount,
            block.timestamp
        ));

        // Create instant transfer record
        instantTransfers[transferId] = InstantTransfer({
            from: _msgSender(),
            to: to,
            amount: amount,
            transferId: transferId,
            timestamp: block.timestamp,
            completed: false
        });

        // Execute transfer
        _transfer(_msgSender(), to, amount);

        instantTransfers[transferId].completed = true;

        emit InstantTransferEvent(_msgSender(), to, amount, transferId);
        return transferId;
    }

    /**
     * @dev Record public ad display
     */
    function recordPublicAdDisplay(
        address device,
        address advertiser,
        uint256 adId,
        bytes32 displayHash,
        uint256 locationHash,
        uint256 rewardAmount
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(device != address(0), "Invalid device");
        require(advertiser != address(0), "Invalid advertiser");
        require(rewardAmount >= MICRO_PAYMENT_MIN, "Reward too small");

        displayCount++;
        bytes32 fullDisplayHash = keccak256(abi.encodePacked(
            device,
            advertiser,
            adId,
            displayHash,
            locationHash,
            block.timestamp
        ));

        // Record the display
        publicAdDisplays[fullDisplayHash] = PublicAdDisplay({
            device: device,
            advertiser: advertiser,
            adId: adId,
            displayHash: displayHash,
            timestamp: block.timestamp,
            locationHash: locationHash,
            rewardAmount: rewardAmount,
            verified: true
        });

        // Track device displays
        deviceAdDisplays[device].push(displayCount);

        emit PublicAdDisplayed(device, advertiser, adId, fullDisplayHash, block.timestamp);
        return displayCount;
    }

    /**
     * @dev Swap WEAD tokens for ETH
     */
    function swapWEADForETH(uint256 weadAmount) external whenNotPaused nonReentrant returns (bool) {
        require(swapEnabled, "Swapping disabled");
        require(weadAmount >= MICRO_PAYMENT_MIN, "Amount too small");
        require(weadAmount <= balanceOf(_msgSender()), "Insufficient WEAD balance");
        require(address(this).balance >= (weadAmount / swapRate), "Insufficient ETH liquidity");

        // Calculate ETH amount
        uint256 ethAmount = weadAmount / swapRate;

        // Burn WEAD tokens
        _burn(_msgSender(), weadAmount);

        // Transfer ETH
        (bool success,) = payable(_msgSender()).call{value: ethAmount}("");
        require(success, "ETH transfer failed");

        totalSwapped += weadAmount;

        emit TokenSwap(_msgSender(), address(this), weadAmount, ethAmount, swapRate);
        return true;
    }

    /**
     * @dev Swap ETH for WEAD tokens
     */
    function swapETHForWEAD() external payable whenNotPaused nonReentrant returns (bool) {
        require(swapEnabled, "Swapping disabled");
        require(msg.value > 0, "Must send ETH");

        // Calculate WEAD amount
        uint256 weadAmount = msg.value * swapRate;

        // Check contract has enough WEAD
        require(balanceOf(address(this)) >= weadAmount, "Insufficient WEAD liquidity");

        // Transfer WEAD tokens
        _transfer(address(this), _msgSender(), weadAmount);

        totalSwapped += weadAmount;

        emit TokenSwap(address(this), _msgSender(), weadAmount, msg.value, swapRate);
        return true;
    }

    /**
     * @dev Batch instant transfers for multiple recipients
     */
    function batchInstantTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external whenNotPaused nonReentrant returns (bytes32[] memory) {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0 && recipients.length <= 50, "Invalid batch size");

        bytes32[] memory transferIds = new bytes32[](recipients.length);
        uint256 totalAmount = 0;

        // Validate all transfers first
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] >= MICRO_PAYMENT_MIN, "Amount too small");
            require(recipients[i] != address(0), "Invalid recipient");
            totalAmount += amounts[i];
        }

        require(totalAmount <= balanceOf(_msgSender()), "Insufficient balance");

        // Execute transfers
        for (uint256 i = 0; i < recipients.length; i++) {
            transferCount++;
            bytes32 transferId = keccak256(abi.encodePacked(
                _msgSender(),
                recipients[i],
                amounts[i],
                transferCount,
                block.timestamp
            ));

            instantTransfers[transferId] = InstantTransfer({
                from: _msgSender(),
                to: recipients[i],
                amount: amounts[i],
                transferId: transferId,
                timestamp: block.timestamp,
                completed: false
            });

            _transfer(_msgSender(), recipients[i], amounts[i]);
            instantTransfers[transferId].completed = true;

            transferIds[i] = transferId;
            emit InstantTransferEvent(_msgSender(), recipients[i], amounts[i], transferId);
        }

        return transferIds;
    }

    // Admin functions
    function addAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
    }

    function removeAuthorizedMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
    }

    function addAuthorizedBurner(address burner) external onlyOwner {
        authorizedBurners[burner] = true;
    }

    function removeAuthorizedBurner(address burner) external onlyOwner {
        authorizedBurners[burner] = false;
    }

    function addAuthorizedDevice(address device) external onlyOwner {
        authorizedDevices[device] = true;
    }

    function removeAuthorizedDevice(address device) external onlyOwner {
        authorizedDevices[device] = false;
    }

    function batchAddAuthorizedDevices(address[] calldata devices) external onlyOwner {
        for (uint256 i = 0; i < devices.length; i++) {
            authorizedDevices[devices[i]] = true;
        }
    }

    function setSwapRate(uint256 _rate) external onlyOwner {
        require(_rate > 0, "Invalid rate");
        swapRate = _rate;
    }

    function toggleSwapEnabled() external onlyOwner {
        swapEnabled = !swapEnabled;
    }

    function setCrossChainBridge(address _bridge) external onlyOwner {
        require(_bridge != address(0), "Invalid bridge address");
        crossChainBridge = _bridge;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Mint function for authorized minters only
    function mint(address to, uint256 amount) external {
        require(authorizedMinters[_msgSender()], "Not authorized to mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    // Emergency burn function
    function emergencyBurn(uint256 amount) external onlyOwner {
        require(amount <= balanceOf(address(this)), "Insufficient balance");
        _burn(address(this), amount);
    }

    // Modifiers
    modifier onlyAuthorizedBridge() {
        require(_msgSender() == crossChainBridge, "Not authorized bridge");
        _;
    }

    modifier onlyAuthorizedBurners() {
        require(authorizedBurners[_msgSender()] || _msgSender() == owner(), "Not authorized");
        _;
    }

    // View functions
    function getMicroPaymentFee(uint256 amount) external pure returns (uint256) {
        return (amount * BURN_RATE) / 10000;
    }

    function isMessageProcessed(bytes32 messageId) external view returns (bool) {
        return processedCrossChainMessages[messageId];
    }

    // New view functions
    function getInstantTransfer(bytes32 transferId) external view returns (
        address from,
        address to,
        uint256 amount,
        uint256 timestamp,
        bool completed
    ) {
        InstantTransfer memory transfer = instantTransfers[transferId];
        return (
            transfer.from,
            transfer.to,
            transfer.amount,
            transfer.timestamp,
            transfer.completed
        );
    }

    function getPublicAdDisplay(bytes32 displayHash) external view returns (
        address device,
        address advertiser,
        uint256 adId,
        uint256 timestamp,
        uint256 locationHash,
        uint256 rewardAmount,
        bool verified
    ) {
        PublicAdDisplay memory display = publicAdDisplays[displayHash];
        return (
            display.device,
            display.advertiser,
            display.adId,
            display.timestamp,
            display.locationHash,
            display.rewardAmount,
            display.verified
        );
    }

    function getDeviceAdDisplays(address device) external view returns (uint256[] memory) {
        return deviceAdDisplays[device];
    }

    function getWEADForETH(uint256 ethAmount) external view returns (uint256) {
        return ethAmount * swapRate;
    }

    function getETHForWEAD(uint256 weadAmount) external view returns (uint256) {
        return weadAmount / swapRate;
    }

    function getTotalInstantTransfers() external view returns (uint256) {
        return transferCount;
    }

    function getTotalPublicDisplays() external view returns (uint256) {
        return displayCount;
    }
}

