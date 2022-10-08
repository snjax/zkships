import * as Comlink from 'comlink';

const workerInstance = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
const worker: any = Comlink.wrap(workerInstance);

async function main() {
  await worker.generateProof();
}

main().catch(console.error);
