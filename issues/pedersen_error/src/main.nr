use dep::std;

fn main(solnHash: pub Field, raw_data: [Field; 2], salt: Field) {
    let mut state = 0;
    for i in 0..2 {
        state = state * 8 + raw_data[i];
    };
    state = state + salt;

    let hash = std::hash::pedersen([state])[0];
    constrain solnHash == hash;
}
