# PROXEE

Proxee is a proxy server that acts as a middle man between the outside world and your API service or services. It provides

* authentication and key management - an api_key parameter must be supplied
* method control - a list of allowed methods and their proxy destination
* logging - access is logged
* https support - incoming and outgoing traffic can be optional over https

## Use-cases

* provide authentication/logging for an unprotected or unmetered API
![Proxee](https://github.com/glynnbird/proxee/raw/master/images/proxee1.png "Proxee")

* provide versioned API calls for legacy back-end systems e.g. /v1 --> system A, /v2 ---> system B
![Proxee](https://github.com/glynnbird/proxee/raw/master/images/proxee2.png "Proxee")

* run proxee behind a load balancer for added resilience
![Proxee](https://github.com/glynnbird/proxee/raw/master/images/proxee3.png "Proxee")

* replace expensive bought-in API management service with in-house proxy

## Architecture

Proxee is a simple Node.js daemon which listens on a custom port. It's configuration is stored in a CouchDB database which contains a database of customers and the api calls each customer is allowed to access. Incoming requests are compared with the list of calls that are allowed: valid API calls are proxied to the calls 'remote_url', invalid API calls are rejected. 

Database interactions are cached for speed, but as the Proxee daemon listens for changes in the database, it automatically expires cache keys if the data changes on the server.

All proxied API calls are logged in a 'usagelogs' database.

If the CouchDB installation is hosted externally (e.g. on Cloudant), then several Proxee servers can be installed behind a load-balancer to add resilience while sharing the same configuration.

## Daemons

* proxee.js - the proxy itself
* proxee_manage.js - a simple API service allowing customers and API calls to be added/removed from the database. This doesn't need to be running for the proxy to work. It is only needed to set up the customers and api calls.

Both daemons can be customised by defining environment variables 

* COUCHDB_URL - The url where CouchDB is hosted - Defaults to "http://localhost:5984"
* PROXEE_HTTP_PORT - The port that proxee.js will listen on for HTTP traffic - Defaults to 5001
* PROXEE_MANAGER_PORT -  The port that proxee_manager_.js will listen on - Defaults to 5002
* PROXEE_HTTPS_PORT - The port that proxee.js will listen on for HTTPS traffic - Defaults to null
* PROXEE_HTTPS_KEY_PATH - The path to the https private key file in PEM format - Defaults to null
* PROXEE_HTTPS_CERT_PATH - The path to the https certificate file in PEM format - Defaults to null
* PROXEE_CUSTOMER_ID_FIELD - the field that the customer_id is insert into the remote url - Defaults to null

e.g.
```
  export COUCHDB_URL="https://myusername:mypassword@myhost.cloudant.com"
  export PROXEE_PORT=6001
  export PROXEE_MANAGER_PORT=6002
```

### proxee.js

The primary application is called "proxee.js". It can be run as follows:

```
  node proxee.js
```

The application will setup any databases and/or views that it needs.


### proxee_manager.js

A second app is availble to run which provides a simpe API for creating customers, adding/removing keys and adding/removing api calls.

#### Running proxee_manager

```
  node proxee_manager.js 
```

which listens on port 5002 by default

#### Creating customers

Using curl, call PUT /customer passing in

* customer_id
* name
* api_key

e.g

```
curl -X PUT -d'customer_id=frank&name=Franks+factory+flooring&api_key=1234567890' 'http://127.0.0.1:5002/customer'
```

#### Adding another api_key to a customer

Using curl, call POST /customer/api_key passing in

* customer_id
* api_key

e.g.

```
 curl -X POST -d'customer_id=frank&api_key=0987654321' 'http://127.0.0.1:5002/customer/api_key'
```

#### Removing an api_key from a customer 

Using curl, call DELETE /customer/api_key passing in

* customer_id
* api_key

e.g.

```
curl -X DELETE -d'customer_id=frank&api_key=0987654321' 'http://127.0.0.1:5002/customer/api_key'
```

#### Adding an apicall to a customer

Using curl, call PUT /customer/apicall pass in

* customer_id
* method
* path
* remote_url

```
curl -X PUT -d'customer_id=frank&method=get&path=/v1/fetch/more/data&remote_url=http://myapi.myserver.com/more' 'http://127.0.0.1:5002/customer/apicall'
```

#### Removing an apicall from a customer

Using curl, call DELETE /customer/apicall pass in

* customer_id
* method
* path

```
curl -X DELETE -d'customer_id=frank&method=get&path=/v1/fetch/more/data' 'http://127.0.0.1:5002/customer/apicall'
```

### Getting usage stats for a customer for today

Using curl, call GET /customer/stats/today passing in

* customer_id

```
curl 'http://127.0.0.1:5002/customer/stats/today?customer_id=frank'
```

### Getting usage stats for a customer for this month, by day

Using curl, call GET /customer/stats/thismonth passing in

* customer_id

```
curl 'http://127.0.0.1:5002/customer/stats/thismonth?customer_id=frank'

## Getting started

* download proxee - git clone https://github.com/glynnbird/proxee/
* in the proxee directory, install dependencies - npm install
* either install CouchDB locally, or set COUCHDB_URL environment variable to point to valid CouchDB server
* run proxee.js 
* run proxee_manager.js
* add a customer using proxee_manager's API
* add an API call using proxee_manager's API
* 

## Data Model

Proxee stores its data in CouchDB in three databases

### customers 

"customers" is list of all customer details and their API keys. A customer record may look like this:

```
{
   "_id": "my_customer_1",
   "_rev": "1-61b77dd18d0aea22125cbb6743dce481",
   "name": "My customer",
   "active": true,
   "date_added": "2014-12-01 12:22:11 +00:00",
   "api_keys": [
       "isfasowqoiwfwfnwfuwbfwfw",
       "eouqgoqwwppfkfmemejxjduw"
   ]
}
```

In the above example, this customer (id = my_customer_1) has two api_keys.

### apicalls

"apicalls" is a list of all the valid calls that permitted to be  made. A record looks like this:

```
{
   "_id": "efa3da222b5c89a06f2bffcdab8145b5",
   "_rev": "1-41105f08c2f2bcafcdc0f2b0f0b87d6a",
   "customer_id": "my_customer_1",
   "method": "GET",
   "path": "/v1/fetch/some/data",
   "remote_url": "http://myrealapi.myserver.com/data"
}
```

The above record pertains to customer "my_customer_1" expects a GET request on the path "/v1/fetch/some/data". If such a call arrives, then it will be proxied to "http://myrealapi.myserver.com/data".

### usagelogs

"usagelogs" simply stores usage statistics e.g.

```
{
   "_id": "fec70b6efb23c5d264d8a68f86009f80",
   "_rev": "1-967522093aa492ff3db3f7756c515e43",
   "method": "GET",
   "path": "/v1/fetch/some/data",
   "api_key": "isfasowqoiwfwfnwfuwbfwfw",
   "customer_id": "my_customer_1",
   "datetime": "2014-04-12 06:59:31 +00:00",
   "ts": 1397285971
}
```

## FAQ

### How do ensure my API traffic is encypted?

* buy a secure certificate. Ensure you have the private key and certificate as PEM files
* configure the following environment variables
* * PROXEE_HTTPS_PORT - The port that proxee.js will listen on for HTTPS traffic - Defaults to null
* * PROXEE_HTTPS_KEY_PATH - The path to the https private key file in PEM format - Defaults to null
* * PROXEE_HTTPS_CERT_PATH - The path to the https certificate file in PEM format - Defaults to null
* run proxee.js

e.g.

```
  export PROXEE_HTTPS_KEY_PATH="/path/to/key.pem"
  export PROXEE_HTTPS_CERT_PATH="/path/to/cert.pem"
  node proxee.js
```

### I want HTTP on port 80 and HTTPs on port 443. How do I do this?

Proxee is designed to be run as a user-space daemon and as such, cannot listen on privileged ports. As root, you can forward the privileged ports 80 & 443 using Iptables rules e.g.

```
  iptables -A PREROUTING -p tcp -m tcp --dport 80 -j REDIRECT --to-ports 5001
  iptables -A PREROUTING -p tcp -m tcp --dport 443 -j REDIRECT --to-ports 5003
  /etc/init.d/iptables save
```   
