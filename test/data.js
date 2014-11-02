var assert = require("assert");

var datagami = require('../');
datagami.options({ host: 'http://localhost:8888' });

describe('/v1/data', function(){
  describe('upload', function(){

    it('should return a data key', function(done){
      datagami.upload({
        data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        callback: function(upload_result) {
          assert(upload_result.data_key);
          assert.equal((typeof upload_result.data_key), 'string');
          assert.equal(upload_result.data_key.length, 40);
          done();
        }
      })
    });

    it('should return a URL containing the data key', function(done){
      datagami.upload({
        data: [2, 4, 6, 8, 10],
        callback: function(upload_result) {
          var data_key = upload_result.data_key;
          var re = new RegExp(data_key + '$');

          assert.equal((typeof upload_result.url), 'string');
          assert(re.test(upload_result.url));
          done();
        }
      })
    })

  })
})
