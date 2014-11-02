var assert = require("assert");

var datagami = require('../');
datagami.options({ host: 'http://localhost:8888' });

var bogus_sample_data = {
    "Input1": [
       1,  2,  3,  4,  5,  6,  7,  8,  9, 10
    ],
    "Input2": [
       1,  1,  2,  2,  3,  3,  4,  4,  5,  5
    ],
    "Input3": [
      10, 20, 10, 20, 10, 20, 10, 20, 10, 20
    ],
    "Input4": [
       5,  5,  4,  4,  3,  3,  2,  2,  1,  1
    ],
    // price = 2*input1 + 3*input2 + input3 - input4
    "Price": [
      10, 22, 12, 30, 26, 38, 34, 46, 42, 54
    ]
};

var bogus_forecast_data = {
    "Input1": [
       3,  6,  9
    ],
    "Input2": [
       2,  4, 10
    ],
    "Input3": [
       9,  7,  6
    ],
    "Input4": [
       2,  1,  8
    ],
    // expected prices:
    // 19, 18, 26
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
          assert.equal((typeof upload_result.data_key), 'string');
          assert.equal(upload_result.data_key.length, 40);

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
          assert.equal((typeof upload_result.data_key), 'string');
          assert.equal(upload_result.data_key.length, 40);

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
          assert.equal((typeof train_result.model_key), 'string');
          assert.equal(train_result.model_key.length, 40);

          console.log(train_result);

          done();
        }
      });

    });
  });
});
