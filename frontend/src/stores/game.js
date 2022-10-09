import { defineStore } from 'pinia'
import { ref } from 'vue'

const FIELD_SIZE = 5
const NUM_CELLS = FIELD_SIZE * FIELD_SIZE
const NUM_SHIPS = 3
const MAX_HEALTH = 3
const NUM_MOVES = 3

// TODO: convert to typescript
export const GameState = {
  PREPARING: 'PREPARING',
  PLAYING: 'PLAYING',
  WAITING: 'WAITING',
}

export const MoveKind = {
  MOVE: 'MOVE',
  ATTACK: 'ATTACK',
}

export const useGameStore = defineStore('game', () => {
  const ships = ref([])
  const selectedCell = ref(null)
  const gameState = ref(GameState.PREPARING)
  const turnMoves = ref([])

  function generateShips() {
    if (gameState.value !== GameState.PREPARING) {
      console.warn('Cannot generate ships in this state')
      return
    }

    ships.value = Array(NUM_SHIPS).fill(0).map(() => randomShip())

    for (let i = 1; i < NUM_SHIPS; i++) {
      while (isShipNearby(ships.value[i].index) || ships.value.filter(ship => ship.index === ships.value[i].index).length > 1) {
        ships.value[i] = randomShip()
      }
    }

    console.log(ships.value)
  }

  function findShip(shipIndex) {
    return ships.value.find(ship => ship.index === shipIndex)
  }

  function findShipIndex(shipIndex) {
    return ships.value.findIndex(ship => ship.index === shipIndex)
  }

  function selectCell(index) {
    selectedCell.value = index
  }


  // FIXME: doesn't work properly for 0
  function isShipNearby(index, ignoreCell) {
    const x = index % FIELD_SIZE
    const y = Math.floor(index / FIELD_SIZE)

    const leftIndex = index - 1
    const rightIndex = index + 1
    const topIndex = index - FIELD_SIZE
    const bottomIndex = index + FIELD_SIZE

    const isSelectLeft = leftIndex === ignoreCell
    const isSelectRight = rightIndex === ignoreCell
    const isSelectTop = topIndex === ignoreCell
    const isSelectBottom = bottomIndex === ignoreCell

    return (x > 0 && findShip(leftIndex) && !(isSelectLeft && ignoreCell)) ||
      (x < FIELD_SIZE - 1 && findShip(rightIndex) && !(isSelectRight && ignoreCell)) ||
      (y > 0 && findShip(topIndex) && !(isSelectTop && ignoreCell)) ||
      (y < FIELD_SIZE - 1 && findShip(bottomIndex) && !(isSelectBottom && ignoreCell))
  }

  function moveShip(shipIndex, to) {
    if (gameState.value !== GameState.PLAYING) {
      console.warn('Cannot move ship in this state')
      return
    }

    if (turnMoves.value.length >= NUM_MOVES) {
      console.warn('Cannot move more ships')
      return
    }

    const id = findShip(shipIndex).id
    const arrayIndex = findShipIndex(shipIndex)
    const xDistance = Math.abs(shipIndex % FIELD_SIZE - to % FIELD_SIZE)
    const yDistance = Math.abs(Math.floor(shipIndex / FIELD_SIZE) - Math.floor(to / FIELD_SIZE))
    const canMove = !isShipNearby(to, shipIndex) && (xDistance + yDistance === 1) && !findShip(to)

    let result = false

    if (canMove && makeMove({ kind: MoveKind.MOVE, shipIndex, to, id })) {
      console.log('moving ship', shipIndex, 'to', to)
      ships.value[arrayIndex].index = to
      result = true
    } else {
      console.log('cannot move ship', shipIndex, 'to', to)
    }

    return result
  }

  function attackShip(shipIndex, attackIndex) {
    return makeMove({ kind: MoveKind.ATTACK, shipIndex, attackIndex, id: findShip(shipIndex).id })
  }

  function makeMove(move) {
    if (gameState.value === GameState.PREPARING || turnMoves.value.length === NUM_MOVES || turnMoves.value.find(m => m.id === move.id)) {
      return false
    }

    turnMoves.value.push(move)
    return true
  }

  function cancelMove() {
    if (turnMoves.value.length === 0) {
      return
    }

    const move = turnMoves.value.pop()
    if (move.kind === MoveKind.MOVE) {
      const arrayIndex = findShipIndex(move.to)
      ships.value[arrayIndex].index = move.shipIndex
    }
  }

  function endTurn() {
    gameState.value = GameState.WAITING
    const moves = turnMoves.value
    turnMoves.value = []
    return moves
  }

  function isShip(index) {
    return !!findShip(index)
  }

  function startGame() {
    if (ships.value.length < NUM_SHIPS) {
      return
    }

    gameState.value = GameState.PLAYING
  }

  return { ships, generateShips, selectCell, isShip, selectedCell, gameState, startGame, attackShip, moveShip, endTurn, turnMoves, cancelMove }
})

function randomShip() {
  const index = randomRange(0, NUM_CELLS - 1)
  return {
    index,
    health: MAX_HEALTH,
    id: randomRange(0, Number.MAX_SAFE_INTEGER),
  }
}

function randomRange(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
