var assert = require("assert");

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
  var n = Math.floor(10 * Math.random());
  var m = Math.floor(100 * Math.random());

  bogus_sample_data.Input1.push(i);
  bogus_sample_data.Input2.push(n);
  bogus_sample_data.Input3.push(m);
  bogus_sample_data.Input4.push(i*n*m);

  // price = 2*input1 + 3*input2 + input3 - input4
  bogus_sample_data.Price.push( 2*i + 3*n + m - i*n*m );
}

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

          // console.log(train_result);

          done();
        }
      });

    });
  });
});
