import * as Comlink from 'comlink'

const workerOriginal = new Worker('/worker.js')
const worker = Comlink.wrap(workerOriginal)

const acirPath = new URL('../../../circuit/build/p.acir', import.meta.url).href

export async function generateTestProof() {
  console.log('Generating proof...')

  const inputs = {
    state_hash: 0,
    pub_data: 0,
    rawdata: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    salt: 0
  }

  const proof = await worker.generateProof(acirPath, inputs)
  console.log(proof)
}
