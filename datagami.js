/**
 * Datagami API Node.js Client
 */

var request = require('request');


var datagami = (function() {
  var options = {};

  options.host = 'https://api.datagami.net';
  options.api_key = '';
  options.secret_key = '';

  var makeRequest = function(opts) {

    // some rudimentary defaults
    if (!opts.method) { opts.method = "GET"; }
    if (!opts.form) { opts.form = {}; }

    if (!opts.endpoint) { /* error! */ }
    if (!opts.callback) { /* error! */ }

    request({
      url: options.host + opts.endpoint,
      method: opts.method,
      form: opts.form,
      auth: {
        username: options.api_key,
        password: options.secret_key
      }
    }, function(error, response, body) {
      var api_result;

      // TODO: proper error handling; response is not a message
      if (error) { opts.error(error); }
      // if (response.statusCode != 200) { opts.error(response); }

      try {
        var api_result = JSON.parse(body);
      } catch (json_error) {
        opts.error(json_error, body);
      }

      opts.callback(api_result);
    });
  }

  // true - job finished
  // false - job still pending
  // null - error
  var testState = function(api_result) {
    if (api_result.status == "SUCCESS") {
      return true;

    } else if (api_result.status == "SUBMITTED" || api_result.status == "RUNNING" || api_result.status == "PENDING") {
      return false;
    }

    return null;
  };

  var generatePollingCallback = function(opts) {
    // TODO: double-check scoping / closure in this block
    var poll_count = 0;
    var url_to_poll;

    var nextTick = function() {
      poll_count ++;
      makeRequest({
        endpoint: url_to_poll,
        method: "GET",
        callback: poll,
        error: opts.error
      });
    }

    var poll = function(api_result) {
      // callback for a request that we expect to have created a job

      switch (testState(api_result)) {
        case true:
          // if we haven't done any polling, this is a cached response returning,
          // which means we need to make a separate request to the model endpoint
          // (i.e. don't setTimeout, but do run nextTick with model URL)
          // TODO: this handling is something of a hack!
          // TODO: maybe the API should just redirect
          if (poll_count === 0) {
            url_to_poll = api_result.url;
            nextTick();
          } else {
            opts.callback(api_result);
          }
          break;
        case false:
          // job still running, wait and then poll again
          if (api_result.url) {
            url_to_poll = api_result.url;
          }

          setTimeout(nextTick, 500);
          break;

        default:
          // TODO: better error handling
          opts.error("unexpected status in response:", api_result);
          break;
      }
    }

    return poll;
  }

  return {
    options: function(opts) {
      if (typeof opts == 'undefined') {
        return (null, options);

      } else if (typeof opts == 'object') {
        for (var name in opts) {
          if (name in options) {
            options[name] = opts[name];
          }
        }

        return (null, options);

      } else {
        // TODO: throw instead? give the option?
        return ({ message: 'Value of type ' + (typeof opts) + ' is not a valid option object' });
      }
    },

    testState: testState,

    model: {
      get: function(opts) {
        // some rudimentary defaults
        if (!opts.error) { opts.error = console.log; }
        if (!opts.callback) { /* error! */ }

        if (opts.params && opts.params.model_key) {
          var model_key = opts.params.model_key;
        } else if (opts.model_key) {
          var model_key = opts.model_key
        } else {
          // error!
        }

        var url = '/v1/model/' + encodeURIComponent(model_key);

        makeRequest({
          endpoint: url,
          method: "GET",
          callback: opts.callback,
          error: opts.error
        });
      }
    },

    upload: function(opts) {
      // some rudimentary defaults
      if (!opts.error) { opts.error = console.log; }

      if (!opts.data) { /* error! */ }
      if (typeof opts.data !== 'object' || typeof opts.data.length !== 'number' ) { /* error! */ }
      if (!opts.callback) { /* error! */ }

      makeRequest({
        endpoint: "/v1/data",
        method: "POST",
        callback: opts.callback,
        error: opts.error,
        form: { data: JSON.stringify(opts.data) }
      });
    },

    data: {
      // upload: dataUpload,

      get: function(opts) {
        // some rudimentary defaults
        if (!opts.error) { opts.error = console.log; }
        if (!opts.callback) { /* error! */ }

        if (opts.params && opts.params.data_key) {
          var data_key = opts.params.data_key;
        } else if (opts.data_key) {
          var data_key = opts.data_key
        } else {
          // error!
        }

        var url = '/v1/data/' + encodeURIComponent(data_key);

        makeRequest({
          endpoint: url,
          method: "GET",
          callback: opts.callback,
          error: opts.error
        });
      }
    },

    text: {
      keywords: function(opts) {
        // some rudimentary defaults
        if (!opts.error) { opts.error = console.log; }
        if (!opts.params) { opts.params = {}; }

        if (!opts.callback) { /* error! */ }

        if (!opts.params.data_key) {
          if (opts.data_key) {
            opts.params.data_key = opts.data_key;
          } else {
            // error!
          }
        }

        // TODO submit as json instead
        if (opts.params.exclude_words && typeof opts.params.exclude_words == 'object'){
          opts.params.exclude_words = JSON.stringify(opts.params.exclude_words);
        }

        makeRequest({
          endpoint: "/v1/text/keywords",
          method: "POST",
          callback: generatePollingCallback(opts),
          error: opts.error,
          form: opts.params
        });
      },
    },

    timeseries: {
      auto: function(opts) {
        // some rudimentary defaults
        if (!opts.error) { opts.error = console.log; }
        if (!opts.params) { opts.params = {}; }

        if (!opts.callback) { /* error! */ }

        if ('poll' in opts && opts.poll === false) {
          var callback = opts.callback;
        } else {
          var callback = generatePollingCallback(opts);
        }

        if (!opts.params.data_key) {
          if (opts.data_key) {
            opts.params.data_key = opts.data_key;
          } else {
            // error!
          }
        }

        makeRequest({
          endpoint: "/v1/timeseries/1D/auto",
          method: "POST",
          callback: callback,
          error: opts.error,
          form: opts.params
        });
      },

      forecast: function(opts) {
        // some rudimentary defaults
        if (!opts.error) { opts.error = console.log; }
        if (!opts.params) { opts.params = {}; }

        if (!opts.callback) { /* error! */ }

        if ('poll' in opts && opts.poll === false) {
          var callback = opts.callback;
        } else {
          var callback = generatePollingCallback(opts);
        }

        if (!opts.params.data_key) {
          if (opts.data_key) {
            opts.params.data_key = opts.data_key;
          } else {
            // error!
          }
        }

        // other options for this endpoint
        // kernel = 'SE'
        // steps_ahead = 10
        // parameters = "[ a, b, c ]"
        // force_retrain = true

        makeRequest({
          endpoint: "/v1/timeseries/1D/forecast",
          method: "POST",
          callback: callback,
          error: opts.error,
          form: opts.params
        });
      },

      nD: {
        train: function(opts) {
          // some rudimentary defaults
          if (!opts.error) { opts.error = console.log; }
          if (!opts.params) { opts.params = {}; }

          if (!opts.callback) { /* error! */ }

          if ('poll' in opts && opts.poll === false) {
            var callback = opts.callback;
          } else {
            var callback = generatePollingCallback(opts);
          }

          if (!opts.params.data_key) {
            if (opts.data_key) {
              opts.params.data_key = opts.data_key;
            } else {
              // error!
            }
          }

          // TODO: validate columns_to_predict
          if (!opts.params.columns_to_predict) {
            if (opts.columns_to_predict) {
              opts.params.columns_to_predict = opts.columns_to_predict;
            } else {
              // error!
            }
          }

          makeRequest({
            endpoint: "/v1/timeseries/nD/train",
            method: "POST",
            callback: callback,
            error: opts.error,
            form: opts.params
          });
        },
        predict: function(opts) {
          // some rudimentary defaults
          if (!opts.error) { opts.error = console.log; }
          if (!opts.params) { opts.params = {}; }

          if (!opts.callback) { /* error! */ }

          if ('poll' in opts && opts.poll === false) {
            var callback = opts.callback;
          } else {
            var callback = generatePollingCallback(opts);
          }

          if (!opts.params.new_data_key) {
            if (opts.data_key) {
              // TODO: should this be opts.new_data_key ??
              opts.params.new_data_key = opts.data_key;
            } else {
              // error!
            }
          }

          if (!opts.params.model_key) {
            if (opts.model_key) {
              opts.params.model_key = opts.model_key;
            } else {
              // error!
            }
          }

          makeRequest({
            endpoint: "/v1/timeseries/nD/predict",
            method: "POST",
            callback: callback,
            error: opts.error,
            form: opts.params
          });
        },
      }
    },

    regression: {
      train: function(opts) {
        // some rudimentary defaults
        if (!opts.error) { opts.error = console.log; }
        if (!opts.params) { opts.params = {}; }

        if (!opts.callback) { /* error! */ }

        if ('poll' in opts && opts.poll === false) {
          var callback = opts.callback;
        } else {
          var callback = generatePollingCallback(opts);
        }

        if (!opts.params.data_key) {
          if (opts.data_key) {
            opts.params.data_key = opts.data_key;
          } else {
            // error!
          }
        }

        // TODO: validate columns_to_predict
        if (!opts.params.column_to_predict) {
          if (opts.column_to_predict) {
            opts.params.column_to_predict = opts.column_to_predict;
          } else {
            // error!
          }
        }

        var DEFAULT_REGRESSION_PARAMS = {
          distribution: "laplace",
          rate: 0.01,
          depth: 3,
          trees: 500,
          cv: 5
        };

        model_params = opts.params.parameters || DEFAULT_REGRESSION_PARAMS;

        // TODO validate JSON
        // TODO make helper
        if (typeof(model_params) !== 'string') {
          opts.params.parameters = JSON.stringify(model_params);
        } else {
          // already a string, pass through to form
          opts.params.parameters = model_params;
        }

        makeRequest({
          endpoint: "/v1/regression/train",
          method: "POST",
          callback: callback,
          error: opts.error,
          form: opts.params
        });
      },
      predict: function(opts) {
        // some rudimentary defaults
        if (!opts.error) { opts.error = console.log; }
        if (!opts.params) { opts.params = {}; }

        if (!opts.callback) { /* error! */ }

        if ('poll' in opts && opts.poll === false) {
          var callback = opts.callback;
        } else {
          var callback = generatePollingCallback(opts);
        }

        if (!opts.params.new_data_key) {
          if (opts.data_key) {
            // TODO: should this be opts.new_data_key ??
            opts.params.new_data_key = opts.data_key;
          } else {
            // error!
          }
        }

        if (!opts.params.model_key) {
          if (opts.model_key) {
            opts.params.model_key = opts.model_key;
          } else {
            // error!
          }
        }

        makeRequest({
          endpoint: "/v1/regression/predict",
          method: "POST",
          callback: callback,
          error: opts.error,
          form: opts.params
        });
      },
    },

    // TODO: extensively duplicated with regression (they're both GBM after all)
    classification: {
      train: function(opts) {
        // some rudimentary defaults
        if (!opts.error) { opts.error = console.log; }
        if (!opts.params) { opts.params = {}; }

        if (!opts.callback) { /* error! */ }

        if ('poll' in opts && opts.poll === false) {
          var callback = opts.callback;
        } else {
          var callback = generatePollingCallback(opts);
        }

        if (!opts.params.data_key) {
          if (opts.data_key) {
            opts.params.data_key = opts.data_key;
          } else {
            // error!
          }
        }

        // TODO: validate columns_to_predict
        if (!opts.params.column_to_predict) {
          if (opts.column_to_predict) {
            opts.params.column_to_predict = opts.column_to_predict;
          } else {
            // error!
          }
        }

        var DEFAULT_CLASSIFICATION_PARAMS = {
          distribution: "multinomial",  // or "bernoulli" for two-class, TODO
          rate: 0.01,
          depth: 3,
          trees: 500,
          cv: 5
        };

        model_params = opts.params.parameters || opts.parameters || DEFAULT_CLASSIFICATION_PARAMS;

        // TODO validate JSON
        // TODO make helper
        if (typeof(model_params) !== 'string') {
          opts.params.parameters = JSON.stringify(model_params);
        } else {
          // already a string, pass through to form
          opts.params.parameters = model_params;
        }

        makeRequest({
          endpoint: "/v1/classification/train",
          method: "POST",
          callback: callback,
          error: opts.error,
          form: opts.params
        });
      },
      predict: function(opts) {
        // some rudimentary defaults
        if (!opts.error) { opts.error = console.log; }
        if (!opts.params) { opts.params = {}; }

        if (!opts.callback) { /* error! */ }

        if ('poll' in opts && opts.poll === false) {
          var callback = opts.callback;
        } else {
          var callback = generatePollingCallback(opts);
        }

        if (!opts.params.new_data_key) {
          if (opts.data_key) {
            // TODO: should this be opts.new_data_key ??
            opts.params.new_data_key = opts.data_key;
          } else {
            // error!
          }
        }

        if (!opts.params.model_key) {
          if (opts.model_key) {
            opts.params.model_key = opts.model_key;
          } else {
            // error!
          }
        }

        makeRequest({
          endpoint: "/v1/classification/predict",
          method: "POST",
          callback: callback,
          error: opts.error,
          form: opts.params
        });
      },
    },
  }
})();

module.exports = datagami;
