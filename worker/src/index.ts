import * as Comlink from 'comlink';

const workerInstance = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
const worker: any = Comlink.wrap(workerInstance);

async function main() {
  const data = {
    is_initial: 0,
    incoming_shoot_result: [1, 0, 0],
    incoming_shoot_state: [
      {x:0, y:0}, {x:1, y:0}, {x:5,y:5}
    ],
    outgoing_shoot_state: [
      {x:1, y:1}, {x:2, y:3}, {x:5,y:5}
    ],
    old_ships:[
      {x:0, y:0, d:3},
      {x:2, y:0, d:3},
      {x:0, y:2, d:3},
    ],
    new_ships:[
      {x:1, y:0, d:2},
      {x:2, y:0, d:3},
      {x:0, y:2, d:3},
    ],
  };

  let proof = await worker.generateShipsProof(data);
  let verified = await worker.verifyShipsProof(proof);

  console.log('Verified', verified);
}

main().catch(console.error);
