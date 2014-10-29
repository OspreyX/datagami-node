/**
 * Datagami API Node.js Client
 */

var request = require('request');


var datagami = (function() {
  var options = {};

  // options.host = 'http://localhost:8888';
  options.host = 'http://beta.api.datagami.net';

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
      // auth: {
      //   username: options.api_key,
      //   password: options.secret_key
      // }
    }, function(error, response, body) {
      var api_result;

      // TODO: proper error handling; response is not a message
      if (error) { opts.error(error); }
      // if (response.statusCode != 200) { opts.error(response); }

      try {
        var api_result = JSON.parse(body);
      } catch (json_error) {
        opts.error(json_error);
      }

      opts.callback(api_result);
    });
  }

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

      if (api_result.status == "SUCCESS") {
        // if we haven't done any polling, this is a cached response returning,
        // which means we need to make a separate request to the model endpoint
        // (i.e. don't setTimeout, but do run nextTick with model URL)
        // TODO: this handling is something of a hack!
        // TODO: maybe the API should just redirect
        if (poll_count === 0) {
          url_to_poll = api_result.model_url;
          nextTick();
        } else {
          opts.callback(api_result);
        }

      } else if (api_result.status == "SUBMITTED" || api_result.status == "RUNNING" || api_result.status == "PENDING") {
        // job still running, wait and then poll again
        if (api_result.model_url) {
          url_to_poll = api_result.model_url;
        }

        setTimeout(nextTick, 500);

      } else {
        // TODO: better error handling
        opts.error("unexpected status in response:", api_result);

      }
    }

    return poll;
  }

  return {
    upload: function(opts) {
      // some rudimentary defaults
      if (!opts.error) { opts.error = console.log; }

      if (!opts.data) { /* error! */ }
      if (typeof opts.data !== 'array') { /* error! */ }
      if (!opts.callback) { /* error! */ }

      makeRequest({
        endpoint: "/v1/data",
        method: "POST",
        callback: opts.callback,
        error: opts.error,
        form: { data: JSON.stringify(opts.data) }
      });
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
      forecast: function(opts) {
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

        // other options for this endpoint
        // kernel = 'SE'
        // steps_ahead = 10
        // parameters = "[ a, b, c ]"
        // force_retrain = true

        makeRequest({
          endpoint: "/v1/timeseries/1D/forecast",
          method: "POST",
          callback: generatePollingCallback(opts),
          error: opts.error,
          form: opts.params
        });
      },
    },

  }
})();

module.exports = datagami;
