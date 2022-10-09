<template>
  <div v-if="!isGameStarted()" class="buttons">
    <button class="btn" @click="generateShips">Generate</button>
    <button class="btn" @click="startGame">Start</button>
  </div>
  <div v-if="isGameStarted()" class="buttons">
    <button class="btn" @click="cancelMove">Cancel move</button>
    <button class="btn" @click="endTurn">Finish</button>
  </div>
  <GameField :ships="ships" @cell-clicked="onPlayerCellClicked" :selected-cell="selectedCell" :highlights="playerHighlights" />
  <GameField @cell-clicked="onOpponentCellClicked" :is-opponent="true" :highlights="opponentHighlights" />
</template>

<script setup>
import { computed } from 'vue'
import GameField from '@/components/GameField.vue'
import { GameState, MoveKind, useGameStore } from '@/stores/game'
import { storeToRefs } from 'pinia'

const { generateShips, selectCell, isShip, moveShip, attackShip, startGame, cancelMove, endTurn } = useGameStore()
const { ships, selectedCell, gameState, turnMoves } = storeToRefs(useGameStore())
generateShips()

const playerHighlights = computed(() => {
  const highlights = []
  for (let move of turnMoves.value) {
    if (move.kind === MoveKind.ATTACK) {
      highlights.push({ index: move.shipIndex, kind: MoveKind.ATTACK })
    } else if (move.kind === MoveKind.MOVE) {
      highlights.push({ index: move.shipIndex, kind: MoveKind.MOVE })
      highlights.push({ index: move.to, kind: MoveKind.MOVE })
    }
  }

  return highlights
})

const opponentHighlights = computed(() => {
  return turnMoves.value.filter(m => m.kind === MoveKind.ATTACK).map((move) => {
    return {
      index: move.attackIndex,
      kind: move.kind,
    }
  })
})

function isGameStarted() {
  return gameState.value !== GameState.PREPARING
}

function onPlayerCellClicked(index) {
  if (index === selectedCell.value) {
    selectCell(null)
  } else if (gameState.value !== GameState.PLAYING) {
    selectCell(index)
  } else if (isShip(selectedCell.value)) {
    if (!isShip(index)) {
      if (!moveShip(selectedCell.value, index)) {
        selectCell(index)
      } else {
        selectCell(null)
      }
    } else {
      selectCell(index)
    }
  } else {
    selectCell(index)
  }
}

function onOpponentCellClicked(index) {
  if (isShip(selectedCell.value)) {
    attackShip(selectedCell.value, index)
  }

  selectCell(null)
}
</script>

<style scoped lang="scss">

</style>
