// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./WeADToken.sol";
import "./AdViewing.sol";

/**
 * @title Cross-Chain Bridge Contract
 * @dev Handles cross-chain WEAD token transfers and ad view synchronization
 * Uses LayerZero protocol for secure cross-chain messaging
 */
contract CrossChainBridge is ReentrancyGuard, Ownable, Pausable {
    WeADToken public weadToken;
    AdViewing public adViewing;

    // LayerZero endpoint
    address public layerZeroEndpoint;

    // Chain IDs mapping (LayerZero format)
    mapping(uint256 => uint16) public chainIdToLzId;
    mapping(uint16 => uint256) public lzIdToChainId;

    // Events
    event CrossChainTransferInitiated(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 destinationChainId,
        bytes32 messageId
    );

    event CrossChainTransferCompleted(
        address indexed to,
        uint256 amount,
        uint256 sourceChainId,
        bytes32 messageId
    );

    event AdViewCrossChainSync(
        uint256 indexed adId,
        address indexed viewer,
        uint256 sourceChainId,
        uint256 destinationChainId,
        bytes32 messageId
    );

    // Message types for cross-chain communication
    uint8 constant public TOKEN_TRANSFER = 1;
    uint8 constant public AD_VIEW_SYNC = 2;
    uint8 constant public BATCH_TRANSFER = 3;

    // State variables
    mapping(bytes32 => bool) public processedMessages;
    mapping(bytes32 => CrossChainMessage) public pendingMessages;

    // Fee management
    uint256 public bridgeFee = 0.0005 ether; // Base fee in BNB (optimized for BSC)
    mapping(uint256 => uint256) public chainSpecificFees; // Additional fees per chain

    struct CrossChainMessage {
        uint8 messageType;
        address sender;
        address recipient;
        uint256 amount;
        uint256 adId;
        uint256 duration;
        uint256 sourceChainId;
        uint256 destinationChainId;
        bytes32 verificationHash;
        bool executed;
        uint256 timestamp;
    }

    constructor(
        address _weadToken,
        address _adViewing,
        address _layerZeroEndpoint
    ) {
        require(_weadToken != address(0), "Invalid WEAD token address");
        require(_adViewing != address(0), "Invalid AdViewing address");
        require(_layerZeroEndpoint != address(0), "Invalid LayerZero endpoint");

        weadToken = WeADToken(_weadToken);
        adViewing = AdViewing(_adViewing);
        layerZeroEndpoint = _layerZeroEndpoint;

        // Initialize chain mappings (LayerZero chain IDs)
        _initializeChainMappings();
    }

    /**
     * @dev Initialize chain ID mappings for LayerZero
     */
    function _initializeChainMappings() internal {
        // BSC (Primary Chain)
        chainIdToLzId[56] = 102;
        lzIdToChainId[102] = 56;

        // Ethereum Mainnet
        chainIdToLzId[1] = 101;
        lzIdToChainId[101] = 1;

        // Base (Secondary Chain)
        chainIdToLzId[8453] = 184; // Base testnet: 10158, mainnet: 184
        lzIdToChainId[184] = 8453;

        // Polygon
        chainIdToLzId[137] = 109;
        lzIdToChainId[109] = 137;

        // Avalanche
        chainIdToLzId[43114] = 106;
        lzIdToChainId[106] = 43114;

        // Arbitrum
        chainIdToLzId[42161] = 110;
        lzIdToChainId[110] = 42161;

        // Optimism
        chainIdToLzId[10] = 111;
        lzIdToChainId[111] = 10;
    }

    /**
     * @dev Initiate cross-chain WEAD token transfer
     */
    function initiateCrossChainTransfer(
        address _to,
        uint256 _amount,
        uint256 _destinationChainId
    ) external payable whenNotPaused nonReentrant returns (bytes32) {
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Invalid amount");
        require(_destinationChainId != block.chainid, "Cannot transfer to same chain");
        require(chainIdToLzId[_destinationChainId] != 0, "Unsupported destination chain");

        // Calculate total fee
        uint256 totalFee = bridgeFee + chainSpecificFees[_destinationChainId];
        require(msg.value >= totalFee, "Insufficient fee payment");

        // Generate message ID
        bytes32 messageId = keccak256(abi.encodePacked(
            block.timestamp,
            _msgSender(),
            _to,
            _amount,
            _destinationChainId,
            block.number
        ));

        // Store pending message
        pendingMessages[messageId] = CrossChainMessage({
            messageType: TOKEN_TRANSFER,
            sender: _msgSender(),
            recipient: _to,
            amount: _amount,
            adId: 0,
            duration: 0,
            sourceChainId: block.chainid,
            destinationChainId: _destinationChainId,
            verificationHash: bytes32(0),
            executed: false,
            timestamp: block.timestamp
        });

        // Burn tokens on source chain
        weadToken.crossChainTransfer(_to, _amount, _destinationChainId, messageId);

        // Prepare cross-chain message
        bytes memory payload = abi.encode(
            TOKEN_TRANSFER,
            _to,
            _amount,
            messageId
        );

        uint16 destinationLzId = chainIdToLzId[_destinationChainId];

        // Send via LayerZero
        _lzSend(destinationLzId, payload, payable(_msgSender()));

        emit CrossChainTransferInitiated(_msgSender(), _to, _amount, _destinationChainId, messageId);

        return messageId;
    }

    /**
     * @dev Sync ad view across chains
     */
    function syncAdViewCrossChain(
        uint256 _adId,
        address _viewer,
        uint256 _duration,
        uint256 _destinationChainId,
        bytes32 _verificationHash
    ) external payable whenNotPaused nonReentrant returns (bytes32) {
        require(_viewer != address(0), "Invalid viewer");
        require(_duration > 0, "Invalid duration");
        require(chainIdToLzId[_destinationChainId] != 0, "Unsupported destination chain");

        uint256 totalFee = bridgeFee + chainSpecificFees[_destinationChainId];
        require(msg.value >= totalFee, "Insufficient fee payment");

        // Generate message ID
        bytes32 messageId = keccak256(abi.encodePacked(
            block.timestamp,
            _viewer,
            _adId,
            _duration,
            _destinationChainId,
            block.number
        ));

        // Store pending message
        pendingMessages[messageId] = CrossChainMessage({
            messageType: AD_VIEW_SYNC,
            sender: _msgSender(),
            recipient: _viewer,
            amount: 0,
            adId: _adId,
            duration: _duration,
            sourceChainId: block.chainid,
            destinationChainId: _destinationChainId,
            verificationHash: _verificationHash,
            executed: false,
            timestamp: block.timestamp
        });

        // Prepare cross-chain message
        bytes memory payload = abi.encode(
            AD_VIEW_SYNC,
            _adId,
            _viewer,
            _duration,
            _verificationHash,
            messageId
        );

        uint16 destinationLzId = chainIdToLzId[_destinationChainId];

        // Send via LayerZero
        _lzSend(destinationLzId, payload, payable(_msgSender()));

        emit AdViewCrossChainSync(_adId, _viewer, block.chainid, _destinationChainId, messageId);

        return messageId;
    }

    /**
     * @dev Receive cross-chain message (LayerZero endpoint callback)
     */
    function lzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) external {
        require(_msgSender() == layerZeroEndpoint, "Invalid endpoint");

        // Decode payload
        (uint8 messageType, bytes memory data) = abi.decode(_payload, (uint8, bytes));

        if (messageType == TOKEN_TRANSFER) {
            (
                address recipient,
                uint256 amount,
                bytes32 messageId
            ) = abi.decode(data, (address, uint256, bytes32));

            _processTokenTransfer(recipient, amount, messageId, lzIdToChainId[_srcChainId]);
        } else if (messageType == AD_VIEW_SYNC) {
            (
                uint256 adId,
                address viewer,
                uint256 duration,
                bytes32 verificationHash,
                bytes32 messageId
            ) = abi.decode(data, (uint256, address, uint256, bytes32, bytes32));

            _processAdViewSync(adId, viewer, duration, verificationHash, messageId, lzIdToChainId[_srcChainId]);
        }
    }

    /**
     * @dev Process received token transfer
     */
    function _processTokenTransfer(
        address _recipient,
        uint256 _amount,
        bytes32 _messageId,
        uint256 _sourceChainId
    ) internal {
        require(!processedMessages[_messageId], "Message already processed");

        // Mint tokens on destination chain
        weadToken.receiveCrossChainTransfer(_recipient, _amount, _messageId);

        processedMessages[_messageId] = true;

        emit CrossChainTransferCompleted(_recipient, _amount, _sourceChainId, _messageId);
    }

    /**
     * @dev Process received ad view sync
     */
    function _processAdViewSync(
        uint256 _adId,
        address _viewer,
        uint256 _duration,
        bytes32 _verificationHash,
        bytes32 _messageId,
        uint256 _sourceChainId
    ) internal {
        require(!processedMessages[_messageId], "Message already processed");

        // Record the cross-chain ad view
        adViewing.recordCrossChainAdView(
            _adId,
            _viewer,
            _duration,
            _sourceChainId,
            _messageId,
            _verificationHash
        );

        processedMessages[_messageId] = true;
    }

    /**
     * @dev Internal LayerZero send function
     */
    function _lzSend(
        uint16 _dstChainId,
        bytes memory _payload,
        address payable _refundAddress
    ) internal {
        bytes memory adapterParams = abi.encodePacked(uint16(1), uint256(200000));

        (uint256 nativeFee,) = ILayerZeroEndpoint(layerZeroEndpoint).estimateFees(
            _dstChainId,
            address(this),
            _payload,
            false,
            adapterParams
        );

        ILayerZeroEndpoint(layerZeroEndpoint).send{value: nativeFee}(
            _dstChainId,
            abi.encodePacked(address(this)),
            _payload,
            _refundAddress,
            address(0),
            adapterParams
        );
    }

    // Admin functions
    function setBridgeFee(uint256 _fee) external onlyOwner {
        bridgeFee = _fee;
    }

    function setChainSpecificFee(uint256 _chainId, uint256 _fee) external onlyOwner {
        chainSpecificFees[_chainId] = _fee;
    }

    function setLayerZeroEndpoint(address _endpoint) external onlyOwner {
        require(_endpoint != address(0), "Invalid endpoint");
        layerZeroEndpoint = _endpoint;
    }

    function addChainMapping(uint256 _chainId, uint16 _lzId) external onlyOwner {
        chainIdToLzId[_chainId] = _lzId;
        lzIdToChainId[_lzId] = _chainId;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function emergencyWithdrawToken(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(owner(), _amount);
    }

    // View functions
    function getChainFee(uint256 _chainId) external view returns (uint256) {
        return bridgeFee + chainSpecificFees[_chainId];
    }

    function isMessageProcessed(bytes32 _messageId) external view returns (bool) {
        return processedMessages[_messageId];
    }

    function getPendingMessage(bytes32 _messageId) external view returns (CrossChainMessage memory) {
        return pendingMessages[_messageId];
    }

    // Required for LayerZero
    function lzReceiveAndRevert(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) external pure {
        revert("Not implemented");
    }
}

// LayerZero interface
interface ILayerZeroEndpoint {
    function send(
        uint16 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable;

    function estimateFees(
        uint16 _dstChainId,
        address _userApplication,
        bytes calldata _payload,
        bool _payInZRO,
        bytes calldata _adapterParams
    ) external view returns (uint256 nativeFee, uint256 zroFee);
}

interface ILayerZeroReceiver {
    function lzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) external;

    function lzReceiveAndRevert(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) external;
}

interface IERC20Token {
    function transfer(address to, uint256 amount) external returns (bool);
}

