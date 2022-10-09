# Seabattle game

![ETHBogota](https://bogota.ethglobal.com/img/ethbogota-logo.svg)


Here is demo of Seabattle game, implemented on [Noir](https://noir-lang.github.io/book/index.html).

Circuits are available [here](https://github.com/snjax/zkships/blob/master/circuit/src/main.nr).



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


