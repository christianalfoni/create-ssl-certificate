#! /usr/bin/env node
const promisify = require('util').promisify;
const exec = promisify(require('child_process').exec);
const path = require('path');

const colors = {
  white: '\x1b[37m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  default: '\x1b[0m'
}

const commands = {
  config(config) {
    return `cat > openssl.cnf <<-EOF
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no
[req_distinguished_name]
CN = *.${config.hostname}.${config.domain}
[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = *.${config.hostname}.${config.domain}
DNS.2 = ${config.hostname}.${config.domain}
EOF`
  },
  ssl: `openssl req \
-new \
-newkey rsa:2048 \
-sha1 \
-days 3650 \
-nodes \
-x509 \
-keyout ssl.key \
-out ssl.crt \
-config openssl.cnf`,
  clean: 'rm openssl.cnf',
  keychain: 'open /Applications/Utilities/Keychain\\ Access.app ssl.crt',
  folder: 'open .'
}

function run (...commands) {
  return Promise.all(commands.map(cmd => exec(cmd)))
}
function runSeries (...commands) {
  return commands.reduce((p, cmd) =>
    p.then(() => exec(cmd)), Promise.resolve()
  )
}

function pause () {
  return new Promise((resolve, reject) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', buffer => {
      return buffer[0] === 3 ? reject() : resolve()
    });
  })
}

function isValid(text, type) {
  if (typeof text !== 'string' || !text.match(/^[a-zA-Z]+$/)) {
    console.log(colors.red, `You did not pass in a valid ${type}`)
    process.exit(1)
  }

  return true;
}

function logAndAbort (error) {
  console.log(colors.red, `Something wrong happened, ${error.message}`)
  process.exit(1)
}

const config = process.argv.reduce((currentConfig, val, index, array) => {
  if (val === '--hostname' && isValid(array[index + 1], 'hostname')) {
    currentConfig.hostname = array[index + 1];
  }

  if (val === '--domain' && isValid(array[index + 1], 'domain')) {
    currentConfig.domain = array[index + 1];
  }

  return currentConfig;
}, {
  domain: 'dev',
  hostname: process.cwd().split(path.sep).pop()
});

runSeries(
  commands.config(config),
  commands.ssl,
  commands.clean
)
.then(() => {
  console.log(`
${colors.green}Certificate created successfully! ${colors.cyan}Press any key to open Keychain Access and this folder, then:
${colors.white}
  1. Drag and drop the created .crt file into Keychain Access -> Certificates
  2. Double click added certificate -> Trust section
  3. Change to always trust
`);
  return pause()
})
.catch(logAndAbort)
.then(() => run(
  commands.keychain,
  commands.folder
))
.then(() => {
  console.log(colors.cyan, 'Note!', colors.white, 'Make sure you are running "dnsmasq" as described here: https://github.com/christianalfoni/create-ssl-certificate')
  process.exit(0)
})
.catch(logAndAbort)
