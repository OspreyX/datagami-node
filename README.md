# datagami-node [![Build Status](https://travis-ci.org/datagami/datagami-node.svg?branch=master)](https://travis-ci.org/datagami/datagami-node)

Datagami API helper library for node.js apps

## Quick start

```
var datagami = require('datagami');

datagami.upload({
  data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  callback: function(upload_result) {
    data_key = upload_result.data_key;

    datagami.timeseries.forecast({
      data_key: data_key,
      callback: function(forecast_result) {
        console.log(forecast_result.predicted[0]);  // should be approximately 10
      }
    });
  }
});
```

## Requirements

Node.js 0.10.x (we depend on a version of [request](https://github.com/request/request) that doesn't work in Node 0.8)

