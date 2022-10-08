

const { resolve, join } = require('path');
const { compile, acir_from_bytes } = require('@noir-lang/noir_wasm');
const { setup_generic_prover_and_verifier, create_proof, verify_proof } = require('@noir-lang/barretenberg/dest/client_proofs');
const { writeFileSync, readFileSync } = require('fs');

async function compileProgram() {
    const binProgram = acir_from_bytes(readFileSync(resolve(__dirname, 'build/main.acir')));
    const jsonProgram = JSON.parse(readFileSync(resolve(__dirname, 'build/main.acirw')));
    const compiledProgram = compile(resolve(__dirname, 'src/main.nr'));

    // console.log(deProgram)
    // console.log(compiledProgram)

    let [prover, verifier] = await setup_generic_prover_and_verifier(jsonProgram.circuit);

    // const sc = verifier.SmartContract();
    // syncWriteFile('./contract/plonk_vk.sol', sc);
    syncWriteFile('./build/main.acirw', JSON.stringify(compiledProgram.circuit));

    // const witness = Buffer.from(readFileSync(join(__dirname, 'build/main.tr')));
    // const witness = Buffer.alloc(1024);
    // witness.fill();
    // witness[0] = 0;



    const proof = await create_proof(prover, jsonProgram.circuit, { a: 1, b: 2 });
    const result = await verify_proof(verifier, proof);
    console.log(proof, result)
}

function syncWriteFile(filename, data) {
    writeFileSync(join(__dirname, filename), data, {
        flag: 'w',
    });
}

async function main() {
    await compileProgram();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
}).finally(() => {
    process.exit(0);
});
