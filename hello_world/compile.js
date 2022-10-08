

const { resolve, join } = require('path');
const { compile } = require('@noir-lang/noir_wasm');
const { setup_generic_prover_and_verifier } = require('@noir-lang/barretenberg/dest/client_proofs');
const { writeFileSync } = require('fs');

async function compileProgram() {
    const compiledProgram = compile(resolve(__dirname, './src/main.nr'));
    const acir = compiledProgram.circuit;

    let [_, verifier] = await setup_generic_prover_and_verifier(acir);

    const sc = verifier.SmartContract();
    syncWriteFile("./contract/plonk_vk.sol", sc);
    syncWriteFile('./build/main.acirw', JSON.stringify(acir));
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
