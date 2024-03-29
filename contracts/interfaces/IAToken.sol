// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.0;

/**
 * @title IAToken
 * @author Aave
 * @notice Defines the basic interface for an AToken.
 **/
interface IAToken {
    function UNDERLYING_ASSET_ADDRESS() external view returns (address);
}
