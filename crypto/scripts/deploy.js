const { ethers, upgrades } = require("hardhat");

async function main() {
  const [admin] = await ethers.getSigners();

  const ZKShips = await ethers.getContractFactory("zkShips");
  const zkShips = await ZKShips.deploy();
  await zkShips.deployed();
  console.log("zkShips contart deployed to:", zkShips.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
