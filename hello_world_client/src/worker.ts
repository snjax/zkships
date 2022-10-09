import * as Comlink from 'comlink';
import { setup_generic_prover_and_verifier } from '@noir-lang/barretenberg/dest/client_proofs';

const acirUrl = new URL('../../hello_world/build/main.acirw', import.meta.url);
const witnessUrl = new URL('../../hello_world/build/main.tr', import.meta.url);

async function generateProof(): Promise<Buffer> {
  const acirData = await (await fetch(acirUrl)).json();
  const witnessData = await (await fetch(witnessUrl)).arrayBuffer();
  const [prover, verifier] = await setup_generic_prover_and_verifier(acirData);
  console.log('Generating proof...');
  const proof = await prover.createProof(new Uint8Array(witnessData));
  console.log('Done!');
  await verifier.verifyProof(proof);
  return proof;
}

Comlink.expose({ generateProof })
