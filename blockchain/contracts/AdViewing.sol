// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./WeADToken.sol";

/**
 * @title Ad Viewing Contract
 * @dev Records ad views and manages micro-payments on Base chain
 * Handles cross-chain ad view verification and rewards
 */
contract AdViewing is ReentrancyGuard, Ownable, Pausable {
    WeADToken public weadToken;

    // Events
    event AdViewed(
        uint256 indexed adId,
        address indexed viewer,
        address indexed advertiser,
        uint256 duration,
        uint256 rewardAmount,
        uint256 timestamp
    );

    event AdViewVerified(
        uint256 indexed viewId,
        bytes32 verificationHash,
        bool approved
    );

    event PublicAdDisplayed(
        address indexed device,
        address indexed advertiser,
        uint256 indexed adId,
        bytes32 displayHash,
        uint256 locationHash,
        uint256 rewardAmount,
        uint256 timestamp
    );

    event CrossChainAdView(
        uint256 indexed adId,
        address indexed viewer,
        uint256 sourceChainId,
        uint256 destinationChainId,
        bytes32 messageId
    );

    event DeviceAdViewEvent(
        address indexed device,
        address indexed advertiser,
        uint256 indexed adId,
        uint256 duration,
        uint256 rewardAmount,
        bytes32 verificationHash,
        uint256 timestamp
    );

    // Structures
    struct AdView {
        uint256 adId;
        address viewer;
        address advertiser;
        uint256 duration;
        uint256 rewardAmount;
        uint256 timestamp;
        bytes32 verificationHash;
        bool isVerified;
        bool isPaid;
        uint256 sourceChainId;
    }

    struct Ad {
        address advertiser;
        uint256 rewardPerSecond;
        uint256 maxBudget;
        uint256 spentBudget;
        uint256 totalViews;
        uint256 createdAt;
        bool isActive;
        string metadata;
    }

    struct DeviceAdView {
        address device;
        uint256 adId;
        address advertiser;
        uint256 duration;
        uint256 rewardAmount;
        bytes32 verificationHash;
        uint256 locationHash;
        uint256 timestamp;
        bool isVerified;
        bool isPaid;
    }

    struct PublicAdDisplay {
        address device;
        uint256 adId;
        address advertiser;
        bytes32 displayHash;
        uint256 locationHash;
        uint256 rewardAmount;
        uint256 timestamp;
        bool isVerified;
    }

    // State variables
    mapping(uint256 => AdView) public adViews;
    mapping(uint256 => Ad) public ads;
    mapping(address => uint256[]) public userAdViews;
    mapping(bytes32 => bool) public processedMessages;

    // Device and public display tracking
    mapping(uint256 => DeviceAdView) public deviceAdViews;
    mapping(bytes32 => PublicAdDisplay) public publicAdDisplays;
    mapping(address => uint256[]) public deviceAdViewHistory;
    mapping(address => uint256[]) public devicePublicDisplays;

    uint256 public deviceViewCount;
    uint256 public publicDisplayCount;

    // Authorized devices for public display recording
    mapping(address => bool) public authorizedDevices;

    uint256 public viewCount;
    uint256 public adCount;
    uint256 public platformFee = 500; // 5% in basis points
    uint256 public minViewDuration = 5; // 5 seconds minimum
    uint256 public maxViewDuration = 300; // 5 minutes maximum

    // Cross-chain variables
    address public crossChainBridge;
    uint256 public currentChainId;

    constructor(address _weadToken, address _crossChainBridge) {
        require(_weadToken != address(0), "Invalid WEAD token address");
        require(_crossChainBridge != address(0), "Invalid bridge address");

        weadToken = WeADToken(_weadToken);
        crossChainBridge = _crossChainBridge;
        currentChainId = block.chainid;
    }

    /**
     * @dev Record a new ad view
     */
    function recordAdView(
        uint256 _adId,
        address _viewer,
        uint256 _duration,
        bytes32 _verificationHash
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_viewer != address(0), "Invalid viewer address");
        require(_duration >= minViewDuration, "View duration too short");
        require(_duration <= maxViewDuration, "View duration too long");
        require(ads[_adId].isActive, "Ad is not active");

        Ad storage ad = ads[_adId];
        require(ad.advertiser != address(0), "Ad does not exist");

        // Calculate reward
        uint256 rewardAmount = (_duration * ad.rewardPerSecond) / 100; // Reward per 100 seconds viewed
        uint256 platformFeeAmount = (rewardAmount * platformFee) / 10000;
        uint256 netReward = rewardAmount - platformFeeAmount;

        // Check if advertiser has sufficient budget
        require(ad.spentBudget + rewardAmount <= ad.maxBudget, "Insufficient ad budget");

        // Create view record
        viewCount++;
        adViews[viewCount] = AdView({
            adId: _adId,
            viewer: _viewer,
            advertiser: ad.advertiser,
            duration: _duration,
            rewardAmount: netReward,
            timestamp: block.timestamp,
            verificationHash: _verificationHash,
            isVerified: true,
            isPaid: false,
            sourceChainId: currentChainId
        });

        // Update ad statistics
        ad.totalViews++;
        ad.spentBudget += rewardAmount;

        // Add to user's view history
        userAdViews[_viewer].push(viewCount);

        emit AdViewed(_adId, _viewer, ad.advertiser, _duration, netReward, block.timestamp);
        emit AdViewVerified(viewCount, _verificationHash, true);

        return viewCount;
    }

    /**
     * @dev Record device ad view for portable displays
     */
    function recordDeviceAdView(
        address device,
        uint256 _adId,
        uint256 _duration,
        uint256 _locationHash,
        bytes32 _verificationHash
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(authorizedDevices[device] || device == _msgSender(), "Device not authorized");
        require(_duration >= minViewDuration, "View duration too short");
        require(_duration <= maxViewDuration, "View duration too long");
        require(ads[_adId].isActive, "Ad is not active");

        Ad storage ad = ads[_adId];
        require(ad.advertiser != address(0), "Ad does not exist");

        // Calculate reward
        uint256 rewardAmount = (_duration * ad.rewardPerSecond) / 100;
        uint256 platformFeeAmount = (rewardAmount * platformFee) / 10000;
        uint256 netReward = rewardAmount - platformFeeAmount;

        // Check if advertiser has sufficient budget
        require(ad.spentBudget + rewardAmount <= ad.maxBudget, "Insufficient ad budget");

        // Create device view record
        deviceViewCount++;
        deviceAdViews[deviceViewCount] = DeviceAdView({
            device: device,
            adId: _adId,
            advertiser: ad.advertiser,
            duration: _duration,
            rewardAmount: netReward,
            verificationHash: _verificationHash,
            locationHash: _locationHash,
            timestamp: block.timestamp,
            isVerified: true,
            isPaid: false
        });

        // Update ad statistics
        ad.totalViews++;
        ad.spentBudget += rewardAmount;

        // Track device history
        deviceAdViewHistory[device].push(deviceViewCount);

        emit DeviceAdViewEvent(device, ad.advertiser, _adId, _duration, netReward, _verificationHash, block.timestamp);
        emit AdViewVerified(deviceViewCount, _verificationHash, true);

        return deviceViewCount;
    }

    /**
     * @dev Record public ad display
     */
    function recordPublicAdDisplay(
        address device,
        uint256 _adId,
        bytes32 _displayHash,
        uint256 _locationHash
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(authorizedDevices[device] || device == _msgSender(), "Device not authorized");
        require(ads[_adId].isActive, "Ad is not active");

        Ad storage ad = ads[_adId];
        require(ad.advertiser != address(0), "Ad does not exist");

        // Calculate reward for public display (different from regular views)
        uint256 rewardAmount = ad.rewardPerSecond; // Base reward for public display
        uint256 platformFeeAmount = (rewardAmount * platformFee) / 10000;
        uint256 netReward = rewardAmount - platformFeeAmount;

        // Check budget
        require(ad.spentBudget + rewardAmount <= ad.maxBudget, "Insufficient ad budget");

        // Create public display record
        bytes32 fullDisplayHash = keccak256(abi.encodePacked(
            device,
            _adId,
            _displayHash,
            _locationHash,
            block.timestamp
        ));

        publicAdDisplays[fullDisplayHash] = PublicAdDisplay({
            device: device,
            adId: _adId,
            advertiser: ad.advertiser,
            displayHash: _displayHash,
            locationHash: _locationHash,
            rewardAmount: netReward,
            timestamp: block.timestamp,
            isVerified: true
        });

        // Update ad statistics
        ad.totalViews++;
        ad.spentBudget += rewardAmount;

        // Track device displays
        publicDisplayCount++;
        devicePublicDisplays[device].push(publicDisplayCount);

        emit PublicAdDisplayed(device, ad.advertiser, _adId, fullDisplayHash, _locationHash, netReward, block.timestamp);
        emit AdViewVerified(publicDisplayCount, _displayHash, true);

        return publicDisplayCount;
    }

    /**
     * @dev Batch record device ad views
     */
    function batchRecordDeviceAdViews(
        address[] calldata devices,
        uint256[] calldata adIds,
        uint256[] calldata durations,
        uint256[] calldata locationHashes,
        bytes32[] calldata verificationHashes
    ) external whenNotPaused nonReentrant returns (uint256[] memory) {
        require(devices.length == adIds.length &&
                adIds.length == durations.length &&
                durations.length == locationHashes.length &&
                locationHashes.length == verificationHashes.length, "Arrays length mismatch");
        require(devices.length > 0 && devices.length <= 50, "Invalid batch size");

        uint256[] memory viewIds = new uint256[](devices.length);

        for (uint256 i = 0; i < devices.length; i++) {
            viewIds[i] = this.recordDeviceAdView(
                devices[i],
                adIds[i],
                durations[i],
                locationHashes[i],
                verificationHashes[i]
            );
        }

        return viewIds;
    }

    /**
     * @dev Pay reward for device ad view
     */
    function payDeviceAdReward(uint256 _deviceViewId) external whenNotPaused nonReentrant returns (bool) {
        DeviceAdView storage deviceView = deviceAdViews[_deviceViewId];
        require(deviceView.isVerified, "View not verified");
        require(!deviceView.isPaid, "Already paid");
        require(deviceView.device != address(0), "Invalid device view record");

        // Pay the reward using WEAD token contract
        bool success = weadToken.payAdReward(
            deviceView.advertiser,
            deviceView.device,
            deviceView.rewardAmount,
            deviceView.adId
        );

        if (success) {
            deviceView.isPaid = true;
        }

        return success;
    }

    /**
     * @dev Record cross-chain ad view
     */
    function recordCrossChainAdView(
        uint256 _adId,
        address _viewer,
        uint256 _duration,
        uint256 _sourceChainId,
        bytes32 _messageId,
        bytes32 _verificationHash
    ) external onlyCrossChainBridge whenNotPaused nonReentrant returns (uint256) {
        require(!processedMessages[_messageId], "Message already processed");
        require(_viewer != address(0), "Invalid viewer address");
        require(_duration >= minViewDuration, "View duration too short");
        require(_duration <= maxViewDuration, "View duration too long");
        require(ads[_adId].isActive, "Ad is not active");

        Ad storage ad = ads[_adId];
        require(ad.advertiser != address(0), "Ad does not exist");

        // Calculate reward
        uint256 rewardAmount = (_duration * ad.rewardPerSecond) / 100;
        uint256 platformFeeAmount = (rewardAmount * platformFee) / 10000;
        uint256 netReward = rewardAmount - platformFeeAmount;

        // Check budget
        require(ad.spentBudget + rewardAmount <= ad.maxBudget, "Insufficient ad budget");

        // Create view record
        viewCount++;
        adViews[viewCount] = AdView({
            adId: _adId,
            viewer: _viewer,
            advertiser: ad.advertiser,
            duration: _duration,
            rewardAmount: netReward,
            timestamp: block.timestamp,
            verificationHash: _verificationHash,
            isVerified: true,
            isPaid: false,
            sourceChainId: _sourceChainId
        });

        // Update statistics
        ad.totalViews++;
        ad.spentBudget += rewardAmount;
        userAdViews[_viewer].push(viewCount);
        processedMessages[_messageId] = true;

        emit AdViewed(_adId, _viewer, ad.advertiser, _duration, netReward, block.timestamp);
        emit CrossChainAdView(_adId, _viewer, _sourceChainId, currentChainId, _messageId);
        emit AdViewVerified(viewCount, _verificationHash, true);

        return viewCount;
    }

    /**
     * @dev Pay reward for ad view
     */
    function payAdReward(uint256 _viewId) external whenNotPaused nonReentrant returns (bool) {
        AdView storage viewRecord = adViews[_viewId];
        require(viewRecord.isVerified, "View not verified");
        require(!viewRecord.isPaid, "Already paid");
        require(viewRecord.viewer != address(0), "Invalid view record");

        // Pay the reward
        bool success = weadToken.payAdReward(
            viewRecord.advertiser,
            viewRecord.viewer,
            viewRecord.rewardAmount,
            viewRecord.adId
        );

        if (success) {
            viewRecord.isPaid = true;
        }

        return success;
    }

    /**
     * @dev Batch pay rewards for multiple views
     */
    function batchPayRewards(uint256[] calldata _viewIds) external whenNotPaused nonReentrant returns (bool) {
        require(_viewIds.length > 0 && _viewIds.length <= 50, "Invalid batch size");

        for (uint256 i = 0; i < _viewIds.length; i++) {
            AdView storage viewRecord = adViews[_viewIds[i]];
            require(viewRecord.isVerified, "View not verified");
            require(!viewRecord.isPaid, "Already paid");
            require(viewRecord.viewer != address(0), "Invalid view record");

            bool success = weadToken.payAdReward(
                viewRecord.advertiser,
                viewRecord.viewer,
                viewRecord.rewardAmount,
                viewRecord.adId
            );

            if (success) {
                viewRecord.isPaid = true;
            }
        }

        return true;
    }

    /**
     * @dev Create new advertisement
     */
    function createAd(
        uint256 _rewardPerSecond,
        uint256 _maxBudget,
        string calldata _metadata
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_rewardPerSecond > 0, "Invalid reward amount");
        require(_maxBudget >= _rewardPerSecond * 10, "Budget too low");
        require(bytes(_metadata).length > 0, "Metadata required");

        adCount++;
        ads[adCount] = Ad({
            advertiser: _msgSender(),
            rewardPerSecond: _rewardPerSecond,
            maxBudget: _maxBudget,
            spentBudget: 0,
            totalViews: 0,
            createdAt: block.timestamp,
            isActive: true,
            metadata: _metadata
        });

        return adCount;
    }

    /**
     * @dev Update ad budget
     */
    function updateAdBudget(uint256 _adId, uint256 _newBudget) external nonReentrant {
        Ad storage ad = ads[_adId];
        require(ad.advertiser == _msgSender(), "Not ad owner");
        require(_newBudget >= ad.spentBudget, "Budget cannot be less than spent amount");
        require(ad.isActive, "Ad is not active");

        ad.maxBudget = _newBudget;
    }

    /**
     * @dev Pause/unpause advertisement
     */
    function toggleAd(uint256 _adId) external {
        Ad storage ad = ads[_adId];
        require(ad.advertiser == _msgSender(), "Not ad owner");

        ad.isActive = !ad.isActive;
    }

    /**
     * @dev Withdraw remaining budget
     */
    function withdrawRemainingBudget(uint256 _adId) external nonReentrant {
        Ad storage ad = ads[_adId];
        require(ad.advertiser == _msgSender(), "Not ad owner");
        require(!ad.isActive, "Ad must be paused first");

        uint256 remainingBudget = ad.maxBudget - ad.spentBudget;
        require(remainingBudget > 0, "No remaining budget");

        // Transfer remaining budget back to advertiser
        weadToken.microTransfer(ad.advertiser, remainingBudget);

        ad.maxBudget = ad.spentBudget; // Set budget to spent amount
    }

    // Admin functions
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        platformFee = _fee;
    }

    function setViewDurationLimits(uint256 _min, uint256 _max) external onlyOwner {
        require(_min > 0 && _max > _min && _max <= 600, "Invalid duration limits");
        minViewDuration = _min;
        maxViewDuration = _max;
    }

    function setCrossChainBridge(address _bridge) external onlyOwner {
        require(_bridge != address(0), "Invalid bridge address");
        crossChainBridge = _bridge;
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

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions
    function getUserAdViews(address _user) external view returns (uint256[] memory) {
        return userAdViews[_user];
    }

    function getAdViews(uint256 _adId) external view returns (uint256) {
        return ads[_adId].totalViews;
    }

    function getAdSpentBudget(uint256 _adId) external view returns (uint256) {
        return ads[_adId].spentBudget;
    }

    function getRemainingBudget(uint256 _adId) external view returns (uint256) {
        Ad storage ad = ads[_adId];
        if (ad.maxBudget > ad.spentBudget) {
            return ad.maxBudget - ad.spentBudget;
        }
        return 0;
    }

    function isAdActive(uint256 _adId) external view returns (bool) {
        return ads[_adId].isActive;
    }

    // New view functions for device and public display tracking
    function getDeviceAdView(uint256 viewId) external view returns (
        address device,
        uint256 adId,
        address advertiser,
        uint256 duration,
        uint256 rewardAmount,
        uint256 locationHash,
        uint256 timestamp,
        bool isVerified,
        bool isPaid
    ) {
        DeviceAdView memory viewRecord = deviceAdViews[viewId];
        return (
            viewRecord.device,
            viewRecord.adId,
            viewRecord.advertiser,
            viewRecord.duration,
            viewRecord.rewardAmount,
            viewRecord.locationHash,
            viewRecord.timestamp,
            viewRecord.isVerified,
            viewRecord.isPaid
        );
    }

    function getPublicAdDisplay(bytes32 displayHash) external view returns (
        address device,
        uint256 adId,
        address advertiser,
        uint256 locationHash,
        uint256 rewardAmount,
        uint256 timestamp,
        bool isVerified
    ) {
        PublicAdDisplay memory display = publicAdDisplays[displayHash];
        return (
            display.device,
            display.adId,
            display.advertiser,
            display.locationHash,
            display.rewardAmount,
            display.timestamp,
            display.isVerified
        );
    }

    function getDeviceAdViewHistory(address device) external view returns (uint256[] memory) {
        return deviceAdViewHistory[device];
    }

    function getDevicePublicDisplays(address device) external view returns (uint256[] memory) {
        return devicePublicDisplays[device];
    }

    function getTotalDeviceViews() external view returns (uint256) {
        return deviceViewCount;
    }

    function getTotalPublicDisplays() external view returns (uint256) {
        return publicDisplayCount;
    }

    function isDeviceAuthorized(address device) external view returns (bool) {
        return authorizedDevices[device];
    }

    // Modifiers
    modifier onlyCrossChainBridge() {
        require(_msgSender() == crossChainBridge, "Not authorized bridge");
        _;
    }
}

