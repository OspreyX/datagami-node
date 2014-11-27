var assert = require('chai').assert

var datagami = require('../');
datagami.options({ host: 'http://localhost:8888' });

var bogus_sample_data = {
    "Input1": [],
    "Input2": [],
    "Input3": [],
    "Input4": [],
    "Price": []
};

for (var i = 0; i < 1000; i ++) {
  var n = 50 + Math.floor(3 * Math.random());
  var m = 100 + Math.floor(5 * Math.random());
  var p = i + n + m * 3;

  bogus_sample_data.Input1.push(i);
  bogus_sample_data.Input2.push(n);
  bogus_sample_data.Input3.push(m);
  bogus_sample_data.Input4.push(p);

  // price = 2*input1 + 3*input2 + input3 - input4
  bogus_sample_data.Price.push( 2*i + 0.5*n + m - p);
}

var bogus_forecast_data = {
    "Input1": [
       30,  500,  900
    ],
    "Input2": [
       51, 50, 52
    ],
    "Input3": [
       101, 104, 102
    ],
    "Input4": [
       384,  862, 1258
    ],
    // expected prices:
    // -197.5, 267, 670
};

describe('/v1/regression', function() {
  var training_data_key, model_key, forecast_data_key;

  describe('bogus sample data', function() {
    it('should return key for training data', function(done) {
      datagami.upload({
        data: bogus_sample_data,
        callback: function(upload_result) {
          training_data_key = upload_result.data_key;

          assert(upload_result.data_key);
          assert.isString(upload_result.data_key);
          assert.lengthOf(upload_result.data_key, 40);

          done();
        }
      });
    });

    it('should return key for forecast data', function(done) {
      datagami.upload({
        data: bogus_forecast_data,
        callback: function(upload_result) {
          forecast_data_key = upload_result.data_key;

          assert(upload_result.data_key);
          assert.isString(upload_result.data_key);
          assert.lengthOf(upload_result.data_key, 40);

          done();
        }
      });
    });

    it('should return a model key after training', function(done) {
      this.timeout(30000);

      datagami.regression.train({
        data_key: training_data_key,
        column_to_predict: 'Price',

        callback: function(train_result) {
          model_key = train_result.model_key;

          assert(train_result.model_key);
          assert.isString(train_result.model_key);
          assert.lengthOf(train_result.model_key, 40);

          // console.log(train_result);

          done();
        }
      });

    });

    it('should predict using new data', function(done) {
      this.timeout(30000);

      datagami.regression.predict({
        params: {
          model_key: model_key,
          new_data_key: forecast_data_key,
        },
        callback: function(prediction_result) {

          assert.equal(prediction_result.status, 'SUCCESS')

          // Check all the keys
          assert.equal(prediction_result.data_key, training_data_key);
          assert.equal(prediction_result.new_data_key, forecast_data_key);
          assert.equal(prediction_result.model_key, model_key);

          error = 20
          assert.closeTo(prediction_result.predicted[0], -197.5, error)
          assert.closeTo(prediction_result.predicted[1],  267.0, error)
          assert.closeTo(prediction_result.predicted[2],  670.0, error)

          done();
        }
      });
    });
  });
});
