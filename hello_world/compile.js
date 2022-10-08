

const { resolve, join } = require('path');
const { compile } = require('@noir-lang/noir_wasm');
const { setup_generic_prover_and_verifier } = require('@noir-lang/barretenberg/dest/client_proofs');
const { writeFileSync, readFileSync } = require('fs');

async function compileProgram() {
    const compiledProgram = compile(resolve(__dirname, 'src/main.nr'));
    const acir = compiledProgram.circuit;

    let [prover, verifier] = await setup_generic_prover_and_verifier(acir);

    const sc = verifier.SmartContract();
    syncWriteFile('./contract/plonk_vk.sol', sc);
    syncWriteFile('./build/main.acirw', JSON.stringify(acir));

    const witness = Buffer.from(readFileSync(join(__dirname, 'build/main.tr')));
    // const witness = Buffer.alloc(1024);
    // witness.fill();
    // witness[0] = 0;

    const proof = await prover.createProof(witness);
    console.log(proof)
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
