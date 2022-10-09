require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.14",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100000,
          },
        },
      },
    ],
  },
  networks: {
    mainnet: {
      url: process.env.MAINNET_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    goerli: {
      url: process.env.GOERLI_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    polygon: {
      url: process.env.POLYGON_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    mumbay:{  //polygon
      url: process.env.MUMBAY_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    // API key for your Etherscan account
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
