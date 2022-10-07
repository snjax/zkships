# zk-ships

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## docker

### build

    docker build --rm --no-cache -t zkships:latest .

### run

    docker run --rm  -p 80:80  --name zkships zkships:latest