# Redlock for Rosmaro
This package makes it possible to use [Redlock](https://github.com/mike-marcacci/node-redlock) with [Rosmaro](https://github.com/lukaszmakuch/rosmaro).

## Usage
The most important thing is to have a [Redlock](https://github.com/mike-marcacci/node-redlock) object. Please check its documentation for more details.

Then in order to make it compatible with Rosmaro, you need to build it this way:
```js
const make_redlock_for_rosmaro = require('rosmaro-redlock')

const lock = make_redlock_for_rosmaro({

  //the Redlock object to use
  redlock,

  //TTL long enough for method calls
  ttl,

  //unique id of the lock
  resource

})
```

## Installing
```
$ npm i rosmaro-redlock
```
