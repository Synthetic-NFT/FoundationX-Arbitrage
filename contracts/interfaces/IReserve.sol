// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

interface IReserve {
    function getMinCollateralRatio() external view returns (uint);

    function getMinterCollateralRatio(address minter, uint assetPrice) external view returns (uint);

    function getNumPages() external view returns (uint);

    function getUserReserveInfo(uint pageIndex, uint256 assetPrice) external view returns (address[] memory addresses, uint256[] memory debts, uint256[] memory collateralRatios);
}
