import { abi } from '../../../crypto/artifacts/contracts/zkShips.sol/zkShips.json'
import { ethers } from 'ethers'

const GAS_LIMIT = 2000000

export class ZkShipsContract {
  constructor(address, signer, chainId) {
    this.signer = signer
    this.chainId = chainId
    this.contract = new ethers.Contract(address, abi, this.signer)
  }

  async createGame() {
    return await this.contract.createGame({
      chainId: this.chainId,
      gasLimit: GAS_LIMIT,
    })
  }

  async step(state, proof) {
    return await this.contract.zkStep(state, proof, {
      chainId: this.chainId,
      gasLimit: GAS_LIMIT,
    })
  }

  async joinGame(id) {
    return await this.contract.join(id, { chainId: this.chainId, gasLimit: GAS_LIMIT })
  }

  async getGames() {
    const IN_PROGRESS = 0
    // FIXME: Change getGames method to return available game ids
    return await this.contract.getGames(IN_PROGRESS, { chainId: this.chainId })
  }

  async waitForTurn(id) {
    return await new Promise((resolve) => {
      this.contract.on('ZkStepMessage', (gameId) => {
        if (gameId === id) {
          this.contract.removeAllListeners('ZkStepMessage')
          resolve()
        }
      })
    })
  }
}