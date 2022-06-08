// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import {IPoolAddressesProvider} from './interfaces/IPoolAddressesProvider.sol';
import {FlashLoanReceiverBase} from './FlashLoanReceiverBase.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";


contract FlashLoanArbitrage is FlashLoanReceiverBase {
    using SafeMath for uint;

    event Log(string message, uint val);

    constructor(IPoolAddressesProvider provider) public FlashLoanReceiverBase(provider) {}

    function getPool() external view returns (address) {
        return ADDRESSES_PROVIDER.getPool();
    }

    function testFlashLoan(address asset, uint amount) external {
        uint bal = IERC20(asset).balanceOf(address(this));
        require(bal > amount, "bal <= amount");

        address receiver = address(this);

        address[] memory assets = new address[](1);
        assets[0] = asset;

        uint[] memory amounts = new uint[](1);
        amounts[0] = amount;

        // 0 = no debt, 1 = stable, 2 = variable
        // 0 = pay all loaned
        uint[] memory modes = new uint[](1);
        modes[0] = 0;

        address onBehalfOf = address(this);

        bytes memory params = "";
        // extra data to pass abi.encode(...)
        uint16 referralCode = 0;

        POOL.flashLoan(
            receiver,
            assets,
            amounts,
            modes,
            onBehalfOf,
            params,
            referralCode
        );
    }

    function executeOperation(
        address[] calldata assets,
        uint[] calldata amounts,
        uint[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // do stuff here (arbitrage, liquidation, etc...)
        // abi.decode(params) to decode params
        for (uint i = 0; i < assets.length; i++) {
            emit Log("borrowed", amounts[i]);
            emit Log("fee", premiums[i]);

            uint amountOwing = amounts[i].add(premiums[i]);
            IERC20(assets[i]).approve(address(POOL), amountOwing);
        }
        // repay Aave
        return true;
    }
}
