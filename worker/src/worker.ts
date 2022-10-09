import * as Comlink from 'comlink';
import { setup_generic_prover_and_verifier, create_proof, verify_proof } from '@noir-lang/barretenberg/dest/client_proofs';
import { acir_from_bytes } from '@noir-lang/noir_wasm';
import { buildMimc7 } from 'circomlibjs'
import * as crypto from "crypto"

const ACIR_PATH = new URL('../../circuit/build/main.acir', import.meta.url).href

let acir, prover, verifier;

async function maybeInit() {
  if (!prover) {
    console.log('Loading ACIR...');
    acir = acir_from_bytes(new Uint8Array(await (await fetch(ACIR_PATH)).arrayBuffer()));
    console.log('Initializing prover...');
    [prover, verifier] = await setup_generic_prover_and_verifier(acir);
    console.log('Prover initialized');
  }
}

async function generateProof(acirUrl: string, inputs: object): Promise<Buffer> {
  await maybeInit();

  console.log('Generating proof...');
  const proof = await create_proof(prover, acir, inputs);
  console.log('Verifying proof...');
  const result = await verify_proof(verifier, proof);
  console.log('Verification result: ', result);
  return proof;
}

function u3_list_to_bigint(l) {
  return l.reduce((acc, v) => (acc << 3n) + BigInt(v), 0n);
}

function bigint_to_bytes32(x) {
  let hex = x.toString(16);
  return "0x" + "0".repeat(64 - hex.length) + hex;
}

function ff_to_bytes32(x, F) {
  let hex = F.toString(x, 16);
  return "0x" + "0".repeat(64 - hex.length) + hex;
}

function flattenObject(o) {
  if (o instanceof Array) {
    return o.map(flattenObject).flat();
  } else if (o instanceof Map) {
    return flattenObject(o.values())
  } if (typeof o === 'object') {
    return flattenObject(Object.values(o))
  } else return o;
}

type Ship = {
  x: number,
  y: number,
  d: number,
}

type Point = {
  x: number,
  y: number,
}

type ShipsData = {
  is_initial: number,
  incoming_shoot_result: [number, number, number],
  incoming_shoot_state: [Point, Point, Point],
  outgoing_shoot_state: [Point, Point, Point],
  old_ships:[Ship, Ship, Ship],
  new_ships:[Ship, Ship, Ship],
}

async function generateShipsProof(data: ShipsData): Promise<Buffer> {
  await maybeInit();

  const salt = BigInt('0x' + crypto.randomBytes(10).toString('hex'));
  const raw_data = flattenObject(data);
  const mimc7 = await buildMimc7();

  console.log('Formatting inputs...');
  let pub_data = bigint_to_bytes32(u3_list_to_bigint(raw_data.slice(0, 16)));
  let old_state_data = bigint_to_bytes32(u3_list_to_bigint(raw_data.slice(16, 16 + 9))*(1n<<80n)+salt);
  let new_state_data = bigint_to_bytes32(u3_list_to_bigint(raw_data.slice(16 + 9, 16 + 9 + 9))*(1n<<80n)+salt);
  let old_state_hash = ff_to_bytes32(mimc7.multiHash([mimc7.F.e(old_state_data)]), mimc7.F);
  let new_state_hash = ff_to_bytes32(mimc7.multiHash([mimc7.F.e(new_state_data)]), mimc7.F);

  // const serializedInputs = serializeInputs([old_state_hash, new_state_hash, pub_data, priv_data, salt]);
  const inputs = {
    old_state_hash,
    new_state_hash,
    pub_data,
    raw_data,
    salt: bigint_to_bytes32(salt)
  };

  return await generateProof(ACIR_PATH, inputs);
}

async function verifyShipsProof(proof: Buffer): Promise<boolean> {
  await maybeInit();

  return await verify_proof(verifier, proof);
}

// let data = {
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

// generateShipsProof(data).then((proof) => {
//   console.log(proof);
// })


Comlink.expose({ generateProof, generateShipsProof, verifyShipsProof })
