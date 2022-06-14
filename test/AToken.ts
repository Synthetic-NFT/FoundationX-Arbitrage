import { ethers } from "hardhat";
import { Provider } from "@ethersproject/providers";
import { IAToken, IWETH } from "../typechain";

describe("#AToken", function () {
  const aWETH_ADDRESS = "0x608D11E704baFb68CfEB154bF7Fd641120e33aD4";
  let aWETH: IAToken;
  let WETH: IWETH;
  let provider: Provider;

  beforeEach(async function () {
    provider = ethers.getDefaultProvider("http://127.0.0.1:8545/");
    aWETH = new ethers.Contract(
      aWETH_ADDRESS,
      require("@aave/core-v3/artifacts/contracts/protocol/tokenization/AToken.sol/AToken.json").abi,
      provider
    ) as IAToken;
    WETH = new ethers.Contract(
      await aWETH.UNDERLYING_ASSET_ADDRESS(),
      require("../abi/contracts/WETH9.json"),
      provider
    ) as IWETH;
  });

  it("Available WETH", async function () {
    const availableWETH = await WETH.balanceOf(aWETH.address);
    console.log(
      "Available WETH to borrow: ",
      ethers.utils.formatEther(availableWETH)
    );
  });
});
