import * as Comlink from 'comlink';
import { setup_generic_prover_and_verifier, create_proof, verify_proof } from '@noir-lang/barretenberg/dest/client_proofs';
import { acir_from_bytes } from '@noir-lang/noir_wasm';

const acirUrl = new URL('../../hello_world/build/main.acir', import.meta.url);

async function generateProof(): Promise<Buffer> {
  const acir = acir_from_bytes(new Uint8Array(await (await fetch(acirUrl)).arrayBuffer()));
  const witnessData = Buffer.alloc(128);
  witnessData.fill(0);

  const [prover, verifier] = await setup_generic_prover_and_verifier(acir);
  console.log('Generating proof...');
  const proof = await create_proof(prover, acir, { a: 1, b: 2 });
  console.log('Verifying proof...');
  const result = await verify_proof(verifier, proof);
  console.log('Verification result: ', result);
  return proof;
}

Comlink.expose({ generateProof })
