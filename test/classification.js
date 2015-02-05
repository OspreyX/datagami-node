var assert = require('chai').assert

var datagami = require('../');
datagami.options({
    host: process.env.TEST_API_URL || 'http://localhost:8888',
    api_key: process.env.TEST_API_KEY,
    secret_key: process.env.TEST_API_SECRET
});


var train_data = require('./classification_nonlinear.json');
var forecast_data = [
    {x: 0.1, y: 0.8},
    {x: 0.2, y: 0.8},
    {x: 0.3, y: 0.8},
    {x: 0.4, y: 0.8},
    {x: 0.5, y: 0.8},
    {x: 0.6, y: 0.8},
    {x: 0.7, y: 0.8},
    {x: 0.8, y: 0.8},
    {x: 0.9, y: 0.8}
]

suite('/v1/classification', function() {
  var training_data_key, model_key, forecast_data_key;

  suite('upload classification data', function() {
    test('should return key for training data', function(done) {
      this.timeout(30000);

      datagami.upload({
        data: train_data,
        callback: function(upload_result) {
          training_data_key = upload_result.data_key;

          assert(upload_result.data_key);
          assert.isString(upload_result.data_key);
          assert.lengthOf(upload_result.data_key, 40);

          done();
        }
      });
    });

    test('should return key for forecast data', function(done) {
      this.timeout(30000);

      datagami.upload({
        data: forecast_data,
        callback: function(upload_result) {
          forecast_data_key = upload_result.data_key;

          assert(upload_result.data_key);
          assert.isString(upload_result.data_key);
          assert.lengthOf(upload_result.data_key, 40);

          done();
        }
      });
    });

    test('should return a model key after training', function(done) {
      this.timeout(120000);

      datagami.classification.train({
        data_key: training_data_key,
        column_to_predict: 'z',
        parameters: {
          distribution: 'bernoulli',
          rate: 0.01,
          depth: 3,
          trees: 1000,
          cv: 2
        },
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

    test('should predict using new data', function(done) {
      this.timeout(120000);

      datagami.classification.predict({
        params: {
          model_key: model_key,
          new_data_key: forecast_data_key,
        },
        callback: function(prediction_result) {

          assert.equal(prediction_result.status, 'SUCCESS')

          // Check all the keys
          assert.equal(prediction_result.new_data_key, forecast_data_key);
          assert.equal(prediction_result.model_key, model_key);

          // console.log(prediction_result);

          assert.deepEqual(
            prediction_result.predicted_classes,
            [1, 1, 0, 0, 1, 0, 0, 1, 1]  
          )

          done();
        }
      });
    });
  });
});
