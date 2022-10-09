import * as Comlink from 'comlink'

const workerOriginal = new Worker('/worker.js')
const worker = Comlink.wrap(workerOriginal)

const acirPath = new URL('../../../circuit/build/main.acir', import.meta.url).href

export async function generateTestProof() {
  const inputs = {
    state_hash: 0,
    pub_data: 0,
    raw_data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    salt: 0
  }

  const proof = await worker.generateProof(acirPath, inputs)
  console.log(proof)
}

export async function generateShipsProof(data) {
  // const data = {
  //   is_initial: 0,
  //   incoming_shoot_result: [1, 0, 0],
  //   incoming_shoot_state: [
  //     {x:0, y:0}, {x:1, y:0}, {x:5,y:5}
  //   ],
  //   outgoing_shoot_state: [
  //     {x:1, y:1}, {x:2, y:3}, {x:5,y:5}
  //   ],
  //   old_ships:[
  //     {x:0, y:0, d:3},
  //     {x:2, y:0, d:3},
  //     {x:0, y:2, d:3},
  //   ],
  //   new_ships:[
  //     {x:1, y:0, d:2},
  //     {x:2, y:0, d:3},
  //     {x:0, y:2, d:3},
  //   ],
  // };

  return await worker.generateShipsProof(data)
}