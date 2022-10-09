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

'nargo compile' fails when Pedersen hash is used:

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
