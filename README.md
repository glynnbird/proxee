# PROXEE

Proxee is a proxy server that acts as a middle man between the outside world and your API service or services. It provides

* authentication and key management - an api_key parameter must be supplied
* method control - a list of allowed methods and their proxy destination
* logging - access is logged

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

## Proxee Manage

A second app is availble to run which provides a simpe API for creating customers, adding/removing keys and adding/removing api calls.

### Running proxee_manager

```
  node proxee_manager.js 
```

which listens on port 3000 by default

### Creating customers

Using curl, call PUT /customer passing in

* customer_id
* name
* api_key

e.g

```
curl -X PUT -d'customer_id=frank&name=Franks+factory+flooring&api_key=1234567890' 'http://127.0.0.1:3000/customer'

### Adding another api_key to a customer

Using curl, call POST /customer/api_key passing in

* customer_id
* api_key

e.g.

```
 curl -X POST -d'customer_id=frank&api_key=0987654321' 'http://127.0.0.1:3000/customer/api_key'
```

### Removing an api_key from a customer 

Using curl, call DELETE /customer/api_key passing in

* customer_id
* api_key

e.g.

```
curl -X DELETE -d'customer_id=frank&api_key=0987654321' 'http://127.0.0.1:3000/customer/api_key'
```

### Adding an apicall to a customer

Using curl, call PUT /customer/apicall pass in

* customer_id
* method
* path
* remote_url

```
curl -X PUT -d'customer_id=frank&method=get&path=/v1/fetch/more/data&remote_url=http://myapi.myserver.com/more' 'http://127.0.0.1:3000/customer/apicall'

### Removing an apicall from a customer

Using curl, call DELETE /customer/apicall pass in

* customer_id
* method
* path

```
curl -X DELETE -d'customer_id=frank&method=get&path=/v1/fetch/more/data' 'http://127.0.0.1:3000/customer/apicall'
```

