import { ethers, network } from "hardhat";
import { IERC20, IUniswapV2Router02, IWETH } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Provider } from "@ethersproject/providers";

describe("#Router", function () {
  const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const WETH_ADDRESS = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
  const USDC_ADDRESS = "0xeb8f08a975Ab53E34D8a0330E0D34de942C95926";
  let router: IUniswapV2Router02;
  let weth: IWETH;
  let usdc: IERC20;
  let owner: SignerWithAddress;
  let provider: Provider;

  beforeEach(async function () {
    provider = ethers.getDefaultProvider("http://127.0.0.1:8545/");
    router = new ethers.Contract(
      ROUTER_ADDRESS,
      require("../abi/contracts/UniswapV2Router02.json"),
      provider
    ) as IUniswapV2Router02;
    weth = new ethers.Contract(
      WETH_ADDRESS,
      require("../abi/contracts/WETH9.json"),
      provider
    ) as IWETH;
    usdc = new ethers.Contract(
      USDC_ADDRESS,
      require("../abi/contracts/USDC.json"),
      provider
    ) as IERC20;
    [owner] = await ethers.getSigners();
  });

  it("Swap WETH for USDC", async function () {
    await network.provider.send("hardhat_setBalance", [
      owner.address,
      ethers.utils.parseEther("400").toHexString(),
    ]);
    await weth.connect(owner).deposit({ value: ethers.utils.parseEther("50") });
    await weth
      .connect(owner)
      .approve(router.address, ethers.utils.parseEther("50.01"));
    await router
      .connect(owner)
      .swapExactTokensForTokens(
        ethers.utils.parseEther("50"),
        ethers.utils.parseEther("0"),
        [WETH_ADDRESS, USDC_ADDRESS],
        owner.address,
        Date.now() + 60
      );
    console.log(
      "WETH balance:",
      ethers.utils.formatEther(await weth.balanceOf(owner.address))
    );
    console.log(
      "USDC balance:",
      ethers.utils.formatEther(await usdc.balanceOf(owner.address))
    );
  });
});
