# Seabattle game

![ETHBogota](https://bogota.ethglobal.com/img/ethbogota-logo.svg)


Here is demo of Seabattle game, implemented on [Noir](https://noir-lang.github.io/book/index.html).

Circuits are available [here](https://github.com/snjax/zkships/blob/master/circuit/src/main.nr).

## Game rules

Variation of the Battleship game is used:

The ocean is a 5x5 grid, on which each ship takes up one square. Each player has 3 ships. Ships cannot be positioned on the neighbor squares.

On every turn each ships can move or fire. Each ship can sustain 3 hits before sinking. Infromation about successfull hit or sinking must be announced to one's opponent.

Game ends when all ships are sunk for some player.


## Build

### Noir

Use [this description](https://docs.aztec.network/developers/noir#install-noir-from-source) how to install noir from source.

### Seabattle circuit & verifier

```bash
git clone https://github.com/snjax/zkships.git
cd zkships/circuit
nargo build
nargo compile p
nargo contract
```

To test the circuit with some data, try

```bash
# 
node test/generate_sample_inputs.js > Prover.toml
nargo prove p
```

### Frontend

Game UI:

<img width="759" alt="battle" src="https://user-images.githubusercontent.com/86690666/194761378-ffa33448-a3a3-460d-be51-da1498b06ff7.png">

Wallet connection:

<img width="577" alt="wallet_connection" src="https://user-images.githubusercontent.com/86690666/194761469-4167f52e-142c-41e6-a2ef-754d24aaff6d.png">

Game creation:

<img width="701" alt="new_game" src="https://user-images.githubusercontent.com/86690666/194761422-007389b5-b872-476a-9904-835754d08efc.png">


## Explored Noir issues

Examples are availble [here](https://github.com/snjax/zkships/tree/master/issues).

### Segmentation fault

'nargo prove' fails with Segmentation fault error:

	Segmentation fault (core dumped)

Code:

```rust
fn main(x : Field, y : pub Field) {
    let flag = (x == 1) & (y == 2);
    constrain flag == true;
}
```

### Stack overflow

'nargo build' fails with stack overflow error:

	thread 'main' has overflowed its stack
	fatal runtime error: stack overflow
	Aborted (core dumped)

Code:

```rust
fn main(x : Field, y : pub Field) {
    let flag = (x == 1) & (y == 2);
    constrain flag | false == flag;
}
```

### Pedersen hash error:

'nargo compile' can fail when Pedersen hash is used:

	thread 'main' panicked at 'Cannot find witness assignment for GadgetInput { witness: Witness(5), num_bits: 254 }', crates/acvm/src/pwg/mod.rs:18:17
	note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace

Code:

```rust
use dep::std;

fn main(solnHash: pub Field, raw_data: [Field; 2], salt: Field) {
    let mut state = 0;
    for i in 0..2 {
        state = state * 8 + raw_data[i];
    };
    state = state + salt;

    let hash = std::haAsh::pedersen([state])[0];
    constrain solnHash == hash;
}
```

### WASM

Next patches were required for WASM worker:
https://github.com/snjax/zkships/tree/master/worker/patches


### Apple silicon mac issue

Nargo build does not work on Mac computers with Apple silicon. System libraries path is incorrect in rust wrapper for barretenberg.
