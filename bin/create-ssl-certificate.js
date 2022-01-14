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

const CRT_NAME = 'ssl'
const KEY_NAME = 'ssl'

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
basicConstraints=critical,CA:FALSE
authorityKeyIdentifier=keyid,issuer
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = *.${config.hostname}.${config.domain}
DNS.2 = ${config.hostname}.${config.domain}
EOF`
  },
  ssl: `openssl req \
-new \
-x509 \
-newkey rsa:4096 \
-sha256 \
-days 7000 \
-nodes \
-keyout ${KEY_NAME}.key \
-out ${CRT_NAME}.crt \
-config openssl.cnf`,
  clean: 'rm openssl.cnf'
}

function run (...commands) {
  return Promise.all(commands.map(cmd => exec(cmd)))
}
function runSeries (...commands) {
  return commands.reduce((p, cmd) =>
    p.then(() => exec(cmd)), Promise.resolve()
  )
}

function isValidHostname(text) {
  if (typeof text !== 'string' || !text.match(/^[a-zA-Z\-0-9]+$/)) {
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

- ${CRT_NAME}.crt
- ${KEY_NAME}.key

${colors.green}OPEN${colors.white} the "Keychain Access" app on your Mac. Then open "Finder" and drag the created certificate (.crt) into the "System" - "Certificates" list.

${colors.cyan}Note! ${colors.white}Make sure the domain is routed to localhost. More info: ${colors.cyan}https://github.com/christianalfoni/create-ssl-certificate
`)
})
.catch(abort)
.then(() => {
  process.exit(0)
})
.catch(logAndAbort)
