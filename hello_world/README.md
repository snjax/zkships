## docker

### build

    docker build --rm --no-cache -t hello_world:latest .

### run

    docker run --rm  -p 80:80  --name hello_world hello_world:latest