// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

interface IOracle {
    function getAssetPrice(string calldata asset) external view returns (uint);
}
