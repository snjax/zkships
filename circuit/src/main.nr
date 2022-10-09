use dep::std;

struct Ship {
    x:u3,
    y:u3,
    d:u3
}

struct Shoot {
    x:u3,
    y:u3
}

fn bnot(x: Field) -> Field {
    1 - x
}

fn band(x: Field, y: Field) -> Field {
    x * y
}

fn bor(x: Field, y: Field) -> Field {
    x + y - x * y
}


fn abs_diff(a: u3, b: u3) -> u3 {
    if a > b {
        a - b
    } else {
        b - a
    }
}

fn load_ship(data: [u3;34], offset: const Field) -> Ship {
    Ship {
        x: data[offset],
        y: data[offset+1],
        d: data[offset+2]
    }
}

fn load_shoot(data: [u3;34], offset: const Field) -> Shoot {
    Shoot {
        x: data[offset],
        y: data[offset+1]
    }
}

fn validate_ship(s: Ship, is_initial:bool) {
    if s.d != 0 {
        constrain s.x < 5; // x
        constrain s.y < 5; // y
    } else {
       constrain s.x == 5; // x
       constrain s.y == 5; // y
    }

    if is_initial {
        constrain s.d == 3; // hp
    } else {
        constrain s.d <= 3; // hp
    }
}


fn validate_collision(s1: Ship, s2: Ship) {
    if s1.d * s2.d != 0 {
        constrain band((abs_diff(s1.x, s2.x)<=1) as Field, (abs_diff(s1.y, s2.y)<=1) as Field) == 0;
    }
}

fn validate_shoot(h:Shoot) -> bool {
    band((h.x<5) as Field, (h.y<5) as Field) as bool
}

fn validate_movement(old:Ship, new:Ship, hits:u3) -> bool {
    if new.d == 0 {
        constrain old.d <= hits;
        true
    } else {
        constrain old.d == new.d + hits;
        (abs_diff(old.x, new.x) + abs_diff(old.y, new.y)) as bool
    }
}

fn check_hit(s:Ship, h:Shoot) -> bool {
    let left = s.x == h.x;
    let right = s.y == h.y;
    band(left as Field, right as Field) as bool
}

// Data structure
// is_initial 
// incoming shoot 0 result
// incoming shoot 1 result
// incoming shoot 2 result
// incoming shoot 0 state
// incoming shoot 1 state
// incoming shoot 2 state
// outgoing shoot 0 state
// outgoing shoot 1 state
// outgoing shoot 2 state
// old ship 0 state
// old ship 1 state
// old ship 2 state
// new ship 0 state
// new ship 1 state
// new ship 2 state

// Incoming shoot results:
//   0 - miss
//   1 - hit
//   2 - destroy

// consider destroyed ship position as (5, 5)
// consider shoot to nothing as (5, 5)




fn main(old_state_hash: pub Field, new_state_hash: pub Field, pub_data: pub Field, raw_data: [Field; 34], salt:Field) {
    let mut data = [0;34];
    for i in 0..34 {
        data[i] = raw_data[i] as u3;
    };

    let is_initial = data[0] as bool;
    
    let incoming_shoot_results = (data[1], data[2], data[3]);

    let incoming_shoots = (
        load_shoot(data, 4),
        load_shoot(data, 6),
        load_shoot(data, 8)
    );

    let outgoing_shoots = (
        load_shoot(data, 10),
        load_shoot(data, 12),
        load_shoot(data, 14)
    );

    let old_ships = (
        load_ship(data, 16),
        load_ship(data, 19),
        load_ship(data, 22)
    );

    let new_ships = (
        load_ship(data, 25),
        load_ship(data, 28),
        load_ship(data, 31)
    );

    constrain incoming_shoot_results.0 <= 2;
    constrain incoming_shoot_results.1 <= 2;
    constrain incoming_shoot_results.2 <= 2;

    validate_ship(old_ships.0, is_initial);
    validate_ship(old_ships.1, is_initial);
    validate_ship(old_ships.2, is_initial);

    validate_ship(new_ships.0, false);
    validate_ship(new_ships.1, false);
    validate_ship(new_ships.2, false);

    let hits = (
        check_hit(old_ships.0, incoming_shoots.0),
        check_hit(old_ships.0, incoming_shoots.1),
        check_hit(old_ships.0, incoming_shoots.2),
        check_hit(old_ships.1, incoming_shoots.0),
        check_hit(old_ships.1, incoming_shoots.1),
        check_hit(old_ships.1, incoming_shoots.2),
        check_hit(old_ships.2, incoming_shoots.0),
        check_hit(old_ships.2, incoming_shoots.1),
        check_hit(old_ships.2, incoming_shoots.2)
    );



    let old_ships_alive = (
        old_ships.0.d != 0,
        old_ships.1.d != 0,
        old_ships.2.d != 0
    );

    let new_ships_alive = (
        new_ships.0.d != 0,
        new_ships.1.d != 0,
        new_ships.2.d != 0
    );


    if incoming_shoot_results.0 == 0 {
        let e1 = hits.0 as Field * old_ships_alive.0 as Field;
        let e2 = hits.3 as Field * old_ships_alive.1 as Field;
        let e3 = hits.6 as Field * old_ships_alive.2 as Field;
        constrain e1+e2+e3==0;
    }


    if incoming_shoot_results.1 == 0 {
        let e1 = hits.1 as Field * old_ships_alive.0 as Field;
        let e2 = hits.4 as Field * old_ships_alive.1 as Field;
        let e3 = hits.7 as Field * old_ships_alive.2 as Field;
        constrain e1+e2+e3==0;
    }

    if incoming_shoot_results.2 == 0 {
        let e1 = hits.2 as Field * old_ships_alive.0 as Field;
        let e2 = hits.5 as Field * old_ships_alive.1 as Field;
        let e3 = hits.8 as Field * old_ships_alive.2 as Field;
        constrain e1+e2+e3==0;
    }

    if incoming_shoot_results.0 == 1 {
        let e1 = hits.0 as Field * old_ships_alive.0 as Field * new_ships_alive.0 as Field;
        let e2 = hits.3 as Field * old_ships_alive.1 as Field * new_ships_alive.1 as Field;
        let e3 = hits.6 as Field * old_ships_alive.2 as Field * new_ships_alive.2 as Field;
        constrain e1+e2+e3!=0;
    }

    if incoming_shoot_results.1 == 1 {
        let e1 = hits.1 as Field * old_ships_alive.0 as Field * new_ships_alive.0 as Field;
        let e2 = hits.4 as Field * old_ships_alive.1 as Field * new_ships_alive.1 as Field;
        let e3 = hits.7 as Field * old_ships_alive.2 as Field * new_ships_alive.2 as Field;
        constrain e1+e2+e3!=0;
    }

    if incoming_shoot_results.2 == 1 {
        let e1 = hits.2 as Field * old_ships_alive.0 as Field * new_ships_alive.0 as Field;
        let e2 = hits.5 as Field * old_ships_alive.1 as Field * new_ships_alive.1 as Field;
        let e3 = hits.8 as Field * old_ships_alive.2 as Field * new_ships_alive.2 as Field;
        constrain e1+e2+e3!=0;
    }

    if incoming_shoot_results.0 == 2 {
        let e1 = hits.0 as Field * old_ships_alive.0 as Field * (1 - new_ships_alive.0 as Field);
        let e2 = hits.3 as Field * old_ships_alive.1 as Field * (1 - new_ships_alive.1 as Field);
        let e3 = hits.6 as Field * old_ships_alive.2 as Field * (1 - new_ships_alive.2 as Field);
        constrain e1+e2+e3!=0;
    }

    if incoming_shoot_results.1 == 2 {
        let e1 = hits.1 as Field * old_ships_alive.0 as Field * (1 - new_ships_alive.0 as Field);
        let e2 = hits.4 as Field * old_ships_alive.1 as Field * (1 - new_ships_alive.1 as Field);
        let e3 = hits.7 as Field * old_ships_alive.2 as Field * (1 - new_ships_alive.2 as Field);
        constrain e1+e2+e3!=0;
    }

    if incoming_shoot_results.2 == 2 {
        let e1 = hits.2 as Field * old_ships_alive.0 as Field * (1 - new_ships_alive.0 as Field);
        let e2 = hits.5 as Field * old_ships_alive.1 as Field * (1 - new_ships_alive.1 as Field);
        let e3 = hits.8 as Field * old_ships_alive.2 as Field * (1 - new_ships_alive.2 as Field);
        constrain e1+e2+e3!=0;
    }


    let actions = validate_movement(old_ships.0, new_ships.0, hits.0 as u3 + hits.1 as u3 + hits.2 as u3) as u3 + 
                  validate_movement(old_ships.1, new_ships.1, hits.3 as u3 + hits.4 as u3 + hits.5 as u3) as u3 + 
                  validate_movement(old_ships.2, new_ships.2, hits.6 as u3 + hits.7 as u3 + hits.8 as u3) as u3 +
                  validate_shoot(outgoing_shoots.0) as u3 +
                  validate_shoot(outgoing_shoots.1) as u3 +
                  validate_shoot(outgoing_shoots.2) as u3;
    constrain actions == 3;



    let mut pub_data2 = 0;

    for i in 0 .. 16 {
        pub_data2 = pub_data2 * 8 + raw_data[i];
    };

    constrain pub_data == pub_data2;


    let mut old_state_data = 0;
    let salt = ((salt as u80) as Field);
    for i in 16..25 {
        old_state_data = old_state_data * 8 + raw_data[i];
    };
    old_state_data = old_state_data * 1208925819614629174706176 + salt;

    let mut new_state_data = 0;

    for i in 25..34 {
        new_state_data = new_state_data * 8 + raw_data[i];
    };
    new_state_data = new_state_data * 1208925819614629174706176 + salt;


    constrain old_state_hash == std::hash::mimc_bn254([old_state_data]);
    constrain new_state_hash == std::hash::mimc_bn254([new_state_data]);


}