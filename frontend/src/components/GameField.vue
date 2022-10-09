<template>
  <div class="game-field" :class="{ opponent: props.isOpponent }">
    <div class="cell" :class="{ 'with-ship': hasShip(index), selected: isSelected(index), attack: isAttack(index), move: isMove(index) }"
      v-for="(cell, index) in cells" v-bind:key="index" @click="$emit('cell-clicked', index)">
    </div>
  </div>
</template>


<script setup>
import { defineProps } from 'vue'
import { MoveKind } from "@/stores/game";

const props = defineProps({
  highlights: {
    type: Array,
    required: false,
    default: () => [],
  },
  selectedCell: {
    type: Number,
    required: false,
    default: null,
  },
  ships: {
    type: Array,
    required: false,
    default: () => [],
  },
  isOpponent: {
    type: Boolean,
    required: false,
    default: false,
  }
})

const cells = Array(5 * 5).fill(0)

function hasShip(index) {
  return !!props.ships.find((ship) => ship.index === index)
}

function isSelected(index) {
  return props.selectedCell === index
}

function isAttack(index) {
  const val = props.highlights.find((highlight) => highlight.index === index)
  return val && val.kind === MoveKind.ATTACK
}

function isMove(index) {
  const val = props.highlights.find((highlight) => highlight.index === index)
  return val && val.kind === MoveKind.MOVE
}
</script>


<style scoped lang="scss">
.game-field {
  display: inline-grid;
  grid-template-columns: auto auto auto auto auto;
  gap: 10px;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.243);
  border-radius: 20px;
  margin-bottom: 20px;
}

.opponent {
  .cell {
    background-color: #367aa279
  }
}

@media screen and (min-width: 560px) {
  .game-field {
    margin-right: 20px;
  }
}

.cell {
  position: relative;
  width: 50px;
  height: 50px;
  background-color: #367aa2;
  border-radius: 20px;
}

.cell:hover {
  opacity: 0.8;
  cursor: pointer;
}

.player {
  background-color: rgb(255, 0, 0);
}

.selected {
  border: 6px solid rgb(35, 79, 105);
}

.with-ship::after {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: #7de3b2;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.attack {
  border: 6px solid #C94F1BFF;
}

.move {
  border: 6px solid #9CBB12FF;
}
</style>
