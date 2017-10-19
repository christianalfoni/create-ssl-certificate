# create-ssl-certificate
Command line tool to create self signed SSL certificate

Based on the following [amazing GIST](https://gist.github.com/jed/6147872).

**NOTE!**

1. This only works on MAC!

2. Requires Node version 8 or higher

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

## Route to localhost

### Simple setup

This setup only works for the specific hostname and no subdomains. Add the following, where you replace hostname and top level domin name to your own configuration:

```
127.0.0.1    myproject.dev
```

to your `/etc/hosts` file.

### Universal setup
You can do a "one time" setup, which works on all hostnames for the given top level domain, etc. `.dev`. A good solution is [dnsmasq](http://www.thekelleys.org.uk/dnsmasq/doc.html). Install it via [homebrew](https://brew.sh/index_no.html).

```sh
brew install dnsmasq
```

To make it start when your mac boots up:

```sh
brew services start dnsmasq
```

To route all top level domain lookups to localhost you will have to run these commands.
Replace `dev` in both echo commands if you chose a different top level domain.

```sh
mkdir -pv $(brew --prefix)/etc
sudo mkdir -pv /etc/resolver
echo "address=/.dev/127.0.0.1" | sudo tee -a $(brew --prefix)/etc/dnsmasq.conf
echo "nameserver 127.0.0.1" | sudo tee /etc/resolver/dev
```

This will probably require a restart of the service.

```sh
brew services restart dnsmasq
```
