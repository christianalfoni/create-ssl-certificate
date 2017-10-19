#! /usr/bin/env node
const exec = require('child_process').exec;

let domain = 'dev'
let hostname = null
const colors = {
  white: '\x1b[37m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  default: '\x1b[0m'
}

const commands = {
  config(domain) {
    return `cat > openssl.cnf <<-EOF
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no
[req_distinguished_name]
CN = *.\${PWD##*/}.${domain}
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = *.\${PWD##*/}.${domain}
DNS.2 = \${PWD##*/}.${domain}
EOF`
  },
  ssl() {
    return `openssl req \
-new \
-newkey rsa:2048 \
-sha1 \
-days 3650 \
-nodes \
-x509 \
-keyout ssl.key \
-out ssl.crt \
-config openssl.cnf`
  },
  clean()  {
    return 'rm openssl.cnf'
  },
  keychain() {
    return 'open /Applications/Utilities/Keychain\\ Access.app ssl.crt'
  },
  folder() {
    return 'open .'
  }
}

function run (command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err)
        return
      }
      resolve(stdout)
    })
  })
}

function pause () {
  return new Promise((resolve, reject) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', resolve);
  })
}

function isValid(text, type) {
  if (typeof text !== 'string' || !text.match(/^[a-zA-Z]+$/)) {
    console.log(colors.red, `You did not pass in a valid ${type}`)
    process.exit(1)
  }
}

process.argv.forEach(function (val, index, array) {
  if (val === '--hostname' && isValid(array[index + 1], 'hostname')) {
    hostname = array[index + 1]
  }
  if (val === '--domain' && isValid(array[index + 1], 'domain')) {
    domain = array[index + 1]
  }
});

run(commands.config('dev'))
.then(() => {
  return run(commands.ssl())
})
.then(() => {
  return run(commands.clean())
})
.then(() => {
  console.log('\n')
  console.log(colors.green, 'Certificate created successfully!', colors.cyan, 'Press any key to open Keychain Access and this folder, then:')
  console.log(colors.white, `
    1. Drag and drop the created .crt file into Keychain Access -> Certificates
    2. Double click added certificate -> Trust section
    3. Change to always trust
  `)
  return pause()
})
.then(() => {
  return Promise.all([
    run(commands.keychain()),
    run(commands.folder())
  ])
})
.then(() => {
  console.log(colors.cyan, 'Note!', colors.white, 'Make sure you are running "dnsmasq" as described here: https://github.com/christianalfoni/create-ssl-certificate')
  process.exit(0)
})
.catch((error) => {
  console.log(colors.red, `Something wrong happened, ${error.message}`)
  process.exit(1)
})
