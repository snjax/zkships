const { ethers, upgrades } = require("hardhat");

async function main() {
  const [admin] = await ethers.getSigners();

  const BaseNFT = await ethers.getContractFactory("BaseNFT");
  const base = await BaseNFT.deploy();
  await base.deployed();
  console.log("nft contract deployed to:", base.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
