var assert = require('chai').assert

var datagami = require('../');
datagami.options({ host: 'http://localhost:8888' });

suite('/v1/data', function(){
  suite('upload', function(){

    test('should return a data key', function(done){
      datagami.upload({
        data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        callback: function(upload_result) {
          assert(upload_result.data_key);
          assert.isString(upload_result.data_key);
          assert.lengthOf(upload_result.data_key, 40);
          done();
        }
      })
    });

    test('should return a URL containing the data key', function(done){
      datagami.upload({
        data: [2, 4, 6, 8, 10],
        callback: function(upload_result) {
          var data_key = upload_result.data_key;
          var re = new RegExp(data_key + '$');

          assert.isString(upload_result.url);
          assert(re.test(upload_result.url));
          done();
        }
      })
    })

  })
})
