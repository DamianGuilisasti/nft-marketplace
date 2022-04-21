require("@nomiclabs/hardhat-waffle");
const fs = require("fs");
const privateKey = fs.readFileSync(".secret").toString();

module.exports = {
  networks: {
    hardhat: {
      chainId: 1337,
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY_TESTNET}`,
      account: [privateKey],
    },
    mainnet: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY_MAINNET}`,
      account: [privateKey],
    },
  },
  solidity: "0.8.4",
};
