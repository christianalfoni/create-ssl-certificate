# create-ssl-certificate
Command line tool to create self signed SSL certificate

**NOTE!** This only works on MAC! Based on the following [amazing GIST](https://gist.github.com/jed/6147872).

## Create

In the folder of your project use the **NPM executer**:

```sh
npx create-ssl-certificate
```

This will create a certificate for the domain: **FOLDER_NAME.dev** and any subdomain.

## Options

### Hostname

```sh
npx create-ssl-certificate --hostname myproject
```

This will create a certificate for the domain: **myproject.dev** and any subdomain.

### Domain

```sh
npx create-ssl-certificate --hostname myproject --domain test
```

This will create a certificate for the domain: **myproject.test** and any subdomain.

## Requirement

You will need to install [dnsmasq](http://www.thekelleys.org.uk/dnsmasq/doc.html) which will route your
domain to localhost. You can install it via [homebrew](https://brew.sh/index_no.html).

```sh
brew install dnsmasq
```

**Note!** Make sure you follow the instructions to start the service when your mac boots up.

To route all domain lookups to localhost you will have to add configuration.
Replace `dev` in both echo commands if you chose a different domain.

```sh
mkdir -pv $(brew --prefix)/etc
sudo mkdir -pv /etc/resolver
echo "address=/.dev/127.0.0.1" | sudo tee -a $(brew --prefix)/etc/dnsmasq.conf
echo "nameserver 127.0.0.1" | sudo tee /etc/resolver/dev
```
