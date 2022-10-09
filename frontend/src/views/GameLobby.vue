<template>
  <div class="buttons">
    <button class="btn" @click="createNewGame">New game</button>
  </div>

  <div class="games">
    <router-link :to="{ name: 'game', params: { id: game } }" class="game" v-for="game in availableGames" v-bind:key="game">{{game}}</router-link>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useLobbyStore } from '@/stores/lobby'
import { useRouter } from 'vue-router'

const { fetchAvailableGames, newGame } = useLobbyStore()
const { availableGames } = storeToRefs(useLobbyStore())
const router = useRouter()

fetchAvailableGames()

function createNewGame() {
  const id = newGame()
  router.push({ name: 'game', params: { id } })
}

</script>

<style scoped lang="scss">
.games {
  display: inline-block;
  //grid-template-columns: auto auto auto auto auto;
  //gap: 10px;
  //width: 650px;
  margin: 20px auto auto auto;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.243);
  border-radius: 20px;
}

.game {
  display: block;
  padding: 5px 20px;
  font-family: monospace;
  margin-bottom: 10px;
  border-radius: 20px;
  background-color: white;
}

.game:hover {
  cursor: pointer;
  opacity: 0.7;
}
</style>
