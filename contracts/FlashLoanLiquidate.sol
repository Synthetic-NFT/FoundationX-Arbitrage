// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

import {IPoolAddressesProvider} from './interfaces/IPoolAddressesProvider.sol';
import {FlashLoanReceiverBase} from './FlashLoanReceiverBase.sol';
import {ISynth} from './interfaces/ISynth.sol';
import {IVault} from './interfaces/IVault.sol';
import {IReserve} from './interfaces/IReserve.sol';
import {IOracle} from './interfaces/IOracle.sol';
import {IWETH} from './interfaces/IWETH.sol';
import {IAToken} from './interfaces/IAToken.sol';
import {IUniswapV2Router02} from './interfaces/IUniswapV2Router02.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";


contract FlashLoanArbitrage is FlashLoanReceiverBase {
    using SafeMath for uint;

    string tokenName;
    IOracle oracle;
    IReserve reserve;
    ISynth synth;
    IVault vault;
    IAToken aWETH;
    IWETH weth;
    IUniswapV2Router02 router;

    address[] liquidableAccounts;
    uint[] liquidableDebts;
    uint totalLiquidableDebts;

    constructor(IPoolAddressesProvider _provider, string memory _tokenName, IOracle _oracle, IReserve _reserve, ISynth _synth, IVault _vault, IAToken _aWETH, IUniswapV2Router02 _router) public FlashLoanReceiverBase(_provider) {
        tokenName = _tokenName;
        oracle = _oracle;
        reserve = _reserve;
        synth = _synth;
        vault = _vault;
        aWETH = _aWETH;
        weth = IWETH(aWETH.UNDERLYING_ASSET_ADDRESS());
        router = _router;
        delete liquidableAccounts;
        delete liquidableDebts;
        totalLiquidableDebts = 0;
    }

    function getPool() external view returns (address) {
        return ADDRESSES_PROVIDER.getPool();
    }

    function flashLoanLiquidate() external {
        uint minCollateralRatio = reserve.getMinCollateralRatio();
        uint assetPrice = oracle.getAssetPrice(tokenName);

        uint numPages = reserve.getNumPages();
        delete liquidableAccounts;
        delete liquidableDebts;
        for (uint pageIndex = 0; pageIndex < numPages; pageIndex++) {
            (address[] memory addresses, uint256[] memory debts, uint256[] memory collateralRatios) = reserve.getUserReserveInfo(pageIndex, assetPrice);
            for (uint i = 0; i < addresses.length; i++) {
                if (collateralRatios[i] < minCollateralRatio) {
                    liquidableAccounts.push(addresses[i]);
                    liquidableDebts.push(debts[i]);
                    totalLiquidableDebts += debts[i];
                }
            }
        }

        address receiver = address(this);

        address[] memory assets = new address[](1);
        assets[0] = address(weth);

        uint[] memory amounts = new uint[](1);
        amounts[0] = weth.balanceOf(address(weth));

        // 0 = no debt, 1 = stable, 2 = variable
        // 0 = pay all loaned
        uint[] memory modes = new uint[](1);
        modes[0] = 0;

        address onBehalfOf = address(this);

        bytes memory params = "";
        // extra data to pass abi.encode(...)
        uint16 referralCode = 0;

        POOL.flashLoan(receiver, assets, amounts, modes, onBehalfOf, params, referralCode);
    }

    function executeOperation(address[] calldata assets, uint[] calldata amounts, uint[] calldata premiums, address initiator, bytes calldata params) external override returns (bool) {
        // do stuff here (arbitrage, liquidation, etc...)
        // abi.decode(params) to decode params
        require(assets.length == 0);
        require(assets[0] == address(weth));
        address [] memory path = new address[](1);
        path[0] = address(weth);
        router.swapTokensForExactTokens(totalLiquidableDebts, amounts[0], path, address(this), block.timestamp);
        for (uint i = 0; i < liquidableAccounts.length; i++) {
            vault.userLiquidateETH(liquidableAccounts[i], liquidableDebts[i]);
        }
        weth.deposit{value : address(this).balance}();
        // repay Aave
        IERC20(assets[0]).approve(address(POOL), amounts[0].add(premiums[0]));
        return true;
    }
}
