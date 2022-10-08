## docker

### build

    docker build --rm --no-cache -t hello_client:latest .

### run

    docker run --rm  -p 80:80  --name hello_client hello_client:latest