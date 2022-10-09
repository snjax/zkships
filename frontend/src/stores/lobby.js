import { ref } from 'vue'
// import { defineStore, storeToRefs } from 'pinia'
import { defineStore } from 'pinia'
import { keccak256 } from "ethers/lib/utils";
// import { useCryptoStore } from '@/stores/crypto'

export const useLobbyStore = defineStore('lobby', () => {
  const availableGames = ref([])
  // const { contract } = storeToRefs(useCryptoStore())

  async function fetchAvailableGames() {

    const games = []
    for (let i = 0; i < 10; i++) {
      const randomHash = keccak256(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
      console.log(randomHash)
      games.push(keccak256(randomHash))
    }

    // availableGames.value = await contract.value.getGames()
    availableGames.value = games
  }

  async function newGame() {
    return keccak256(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
    // return await contract.value.createGame()

  }

  return { availableGames, fetchAvailableGames, newGame }
})