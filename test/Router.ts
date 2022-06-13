import { ethers, network } from "hardhat";
import {
  IERC20,
  IUniswapV2Factory,
  IUniswapV2Pair,
  IUniswapV2Router02,
  IWETH,
} from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Provider } from "@ethersproject/providers";

describe("#Router", function () {
  const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  const WETH_ADDRESS = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
  const USDC_ADDRESS = "0xeb8f08a975Ab53E34D8a0330E0D34de942C95926";
  let router: IUniswapV2Router02;
  let factory: IUniswapV2Factory;
  let pair: IUniswapV2Pair;
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
    factory = new ethers.Contract(
      FACTORY_ADDRESS,
      require("../abi/contracts/UniswapV2Factory.json"),
      provider
    ) as IUniswapV2Factory;
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
    pair = new ethers.Contract(
      await factory.getPair(WETH_ADDRESS, USDC_ADDRESS),
      require("../abi/contracts/UniswapV2Pair.json"),
      provider
    ) as IUniswapV2Pair;
    [owner] = await ethers.getSigners();
  });

  it("Swap WETH for USDC", async function () {
    const [token0Reserve, token1Reserve, _] = await pair.getReserves();
    const [wethReserve, usdcReserve] =
      WETH_ADDRESS < USDC_ADDRESS
        ? [token0Reserve, token1Reserve]
        : [token1Reserve, token0Reserve];

    console.log("WETH reserve: ", ethers.utils.formatEther(wethReserve));
    console.log("USDC reserve: ", ethers.utils.formatEther(usdcReserve));

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
