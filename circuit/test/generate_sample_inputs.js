const { BarretenbergWasm } = require('@noir-lang/barretenberg/dest/wasm');
const { SinglePedersen } = require('@noir-lang/barretenberg/dest/crypto/pedersen');
const { serialise_public_inputs } = require('@noir-lang/aztec_backend');

// import { compile, acir_from_bytes } from '@noir-lang/noir_wasm';
// import { setup_generic_prover_and_verifier, create_proof, verify_proof } from '@noir-lang/barretenberg/dest/client_proofs';
// import { resolve } from 'path';
// import { readFileSync } from 'fs';
// import { expect } from 'chai';


function serialise_inputs(values) {
    let serialised_inputs = []
    for (var i = 0; i < values.length; i++) {
        let number_hex = values[i].toString(16);
        let padded_number_hex = number_hex.length %2 == 0 ? "0x" + number_hex : "0x0" + number_hex; // TOOD: this logic should be placed inside the `serialise_public_inputs` method
        serialised_inputs.push(
            Buffer.from(serialise_public_inputs([padded_number_hex]))
        );
    }
    return serialised_inputs;
}

function u3_list_to_bigint(l) {
    return l.reduce((acc, v) => (acc << 3n) + BigInt(v), 0n);
}

function bigint_to_bytes32(x) {
    let hex = x.toString(16);
    return "0x" + "0".repeat(64 - hex.length) + hex;
}

function flatten_object(o) {
    if (o instanceof Array) {
        return o.map(flatten_object).flat();
    } else if (typeof o === 'object') {
        return flatten_object(Object.values(o))
    } else return o;
}



let data = {
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
let salt = 42;

let raw_data = flatten_object(data);



(async() => { 
    const barretenberg = await BarretenbergWasm.new();
    await barretenberg.init();
    const pedersen = new SinglePedersen(barretenberg);

    let pub_data = bigint_to_bytes32(u3_list_to_bigint(raw_data.slice(0, 16)));
    //let data_compressed = u3_list_to_bigint(raw_data);
    //let state_hash = "0x"+pedersen.compressInputs(serialise_inputs([data_compressed])).toString('hex');
    //let state_hash = "0x"+pedersen.compressInputs(serialise_inputs(raw_data)).toString('hex');
    let state_hash = bigint_to_bytes32((u3_list_to_bigint(raw_data)<<80n)+BigInt(salt));


    console.log(`state_hash="${state_hash}"`);
    console.log(`pub_data="${pub_data}"`);
    console.log(`raw_data=${JSON.stringify(raw_data.map(e=>e.toString()))}`);
    console.log(`salt="${salt}"`);
    
})();