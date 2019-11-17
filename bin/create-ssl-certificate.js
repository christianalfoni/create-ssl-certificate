#! /usr/bin/env node
const promisify = require('util').promisify
const exec = promisify(require('child_process').exec)
const path = require('path')

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
keyUsage = digitalSignature, keyEncipherment, dataEncipherment
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
  keychain: 'open /Applications/Utilities/Keychain\\ Access.app ssl.crt'
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
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('data', buffer => {
      return buffer[0] === 3 ? reject('Ok, aborted opening Keychain Access and folder') : resolve()
    })
  })
}

function isValidHostname(text) {
  if (typeof text !== 'string' || !text.match(/^[a-zA-Z\-]+$/)) {
    console.error(colors.red + `You did not pass in a valid hostname`)
    process.exit(1)
  }

  return true
}

function isValidDomain(text) {
  if (typeof text !== 'string' || !text.match(/^[a-zA-Z]+$/)) {
    console.error(colors.red + `You did not pass in a valid domain`)
    process.exit(1)
  }

  return true
}

function logAndAbort (error) {
  console.error(colors.red + `Something wrong happened, ${error.message}`)
  process.exit(1)
}

function abort (message) {
  console.log(colors.red + message)
  process.exit(0)
}

const config = process.argv.reduce((currentConfig, val, index, array) => {
  if (val === '--hostname' && isValidHostname(array[index + 1])) {
    currentConfig.hostname = array[index + 1]
  }

  if (val === '--domain' && isValidDomain(array[index + 1])) {
    currentConfig.domain = array[index + 1]
  }

  return currentConfig
}, {
  domain: 'test',
  hostname: process.cwd().split(path.sep).pop()
})

runSeries(
  commands.config(config),
  commands.ssl,
  commands.clean
)
.then(() => {
  console.log(`
${colors.green}✔ ${colors.white}Certificate for ${colors.green}*.${config.hostname}.${config.domain} ${colors.white}created successfully!

${colors.cyan}Press any key ${colors.white}to open Keychain Access, then:

  1. Double click added certificate and expand the "Trust" section
  2. Change to "Always trust" on first dropdown
  3. If your certificate is not there you can drag and drop "ssl.crt" from this folder into Keychain Access

${colors.cyan}Note! ${colors.white}Make sure the domain is routed to localhost. More info: ${colors.cyan}https://github.com/christianalfoni/create-ssl-certificate
`)
  return pause()
})
.catch(abort)
.then(() => run(
  commands.keychain
))
.then(() => {
  process.exit(0)
})
.catch(logAndAbort)
