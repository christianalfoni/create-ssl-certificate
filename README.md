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

This will create a certificate for the domain: **FOLDER_NAME.test** and any subdomain.

## Options

### Hostname

```sh
npx create-ssl-certificate --hostname myproject
```

This will create a certificate for the domain: **myproject.test** and any subdomain.

### Domain

```sh
npx create-ssl-certificate --hostname myproject --domain localhost
```

This will create a certificate for the domain: **myproject.test** and any subdomain.  Only `test` and `localhost` are recommended because they are specifically reserved as [special-use domains](https://tools.ietf.org/html/rfc6761).

## Route to localhost

You choose **either** 1. or 2.

### 1. Simple setup

This setup only works for the specific hostname and no subdomains. Add the following, where you replace hostname and top level domin name to your own configuration:

```
127.0.0.1    myproject.test
```

to your `/etc/hosts` file.

### 2. Universal setup
You can do a "one time" setup, which works on all hostnames for the given top level domain, etc. `.test`. A good solution is [dnsmasq](http://www.thekelleys.org.uk/dnsmasq/doc.html). Install it via [homebrew](https://brew.sh/index_no.html).

```sh
brew install dnsmasq
```

To make it start when your mac boots up:

```sh
brew services start dnsmasq
```

To route all top level domain lookups to localhost you will have to run these commands.
Replace `test` in both echo commands if you chose a different top level domain.

```sh
mkdir -pv $(brew --prefix)/etc
sudo cp -v $(brew --prefix dnsmasq)/homebrew.mxcl.dnsmasq.plist /Library/LaunchDaemons
sudo launchctl load -w /Library/LaunchDaemons/homebrew.mxcl.dnsmasq.plist
sudo mkdir -pv /etc/resolver
echo "address=/.test/127.0.0.1" | sudo tee -a $(brew --prefix)/etc/dnsmasq.conf
echo "nameserver 127.0.0.1" | sudo tee /etc/resolver/test
```

You usually have to **restart** your computer for this to take proper effect.
