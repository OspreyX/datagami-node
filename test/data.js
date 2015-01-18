var assert = require('chai').assert

var datagami = require('../');
datagami.options({
    host: process.env.TEST_API_URL || 'http://localhost:8888',
    api_key: process.env.TEST_API_KEY,
    secret_key: process.env.TEST_API_SECRET
});

suite('/v1/data', function(){
  suite('[1...10]', function(){

    var bogus_sample_data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    test('upload data, test URL, download data', function(done){
      this.timeout(30000);

      datagami.upload({
        data: bogus_sample_data,
        callback: function(upload_result) {
          assert.isString(upload_result.data_key);
          assert.lengthOf(upload_result.data_key, 40);

          var re = new RegExp('\/v1\/data\/' + upload_result.data_key + '$');

          assert.isString(upload_result.url);
          assert(re.test(upload_result.url));

          // now try to fetch back that data
          datagami.data.get({
            data_key: upload_result.data_key,

            callback: function(data_result) {
              assert.equal(data_result.status, 'SUCCESS');
              assert.equal(data_result.data_key, upload_result.data_key);

              assert.deepEqual(bogus_sample_data, data_result.data);

              done();
            }
          });
        }
      })
    })

  })
})
