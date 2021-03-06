var chai = require('chai'),
    chaiStats = require('chai-stats');

chai.use(chaiStats);
var assert = chai.assert;

var datagami = require('../');
datagami.options({
    host: process.env.TEST_API_URL || 'http://localhost:8888',
    api_key: process.env.TEST_API_KEY,
    secret_key: process.env.TEST_API_SECRET
});

// United States GDP from 1960 to 2012
// from http://www.quandl.com/api/v1/datasets/WORLDBANK/USA_NY_GDP_MKTP_KN.json?&trim_start=1960-12-31&trim_end=2012-12-31&sort_order=desc
var sample_data = [
  14231574698643,
  13846778425918,
  13595644353592,
  13263098686392,
  13645503206047,
  13685243103206,
  13444595948186,
  13095400000000,
  12670771839613,
  12207139706089,
  11875697924921,
  11668443322375,
  11558790643176,
  11104541540926,
  10591234535952,
  10140021120290,
  9704538080586.7,
  9349638721234.1,
  9102184269015.7,
  8749032729214.1,
  8515284861895.5,
  8222939044367.6,
  8228918427042.1,
  8074006420523.2,
  7787364014161.7,
  7473216447497.8,
  7223186261204.3,
  6978123562055.7,
  6694332861277.4,
  6241279635561.5,
  5964940165500.6,
  6081124170389.7,
  5927316049903.1,
  5941850549327,
  5758973429992.4,
  5455588752142.5,
  5215217568630.8,
  4948629091854.2,
  4958472075641.3,
  4984229416392.7,
  4718008901626.9,
  4482697195762.7,
  4339835945095.4,
  4204990019960.1,
  4078554820523.8,
  3891750782942.6,
  3796830032139.1,
  3565098621726.9,
  3350656599367.4,
  3166972211122.3,
  3033498286515.6,
  285909357824.8,
  2794812881958.8
];


suite('/v1/timeseries/1D', function() {

  var data_key;

  suite('US GDP sample data', function() {
    test('Data upload', function(done) {
      this.timeout(30000);

      datagami.upload({
        data: sample_data,
        callback: function(upload_result) {
          data_key = upload_result.data_key;

          done();
        }
      });

    });

    test('Automatic forecast', function(done) {
      this.timeout(180000);

      datagami.timeseries.auto({
        data_key: data_key,

        callback: function(forecast_result) {
          assert.equal(forecast_result.status, 'SUCCESS');
          assert.equal(forecast_result.type, 'TimeSeries1Dauto');

          assert.lengthOf(forecast_result.model_keys, 41);
          assert.lengthOf(Object.keys(forecast_result.models), forecast_result.model_keys.length);

          assert(forecast_result.meta_key);
          assert(forecast_result.test_set_length);
          assert(forecast_result.data_key);

          for (var kernel in forecast_result.models) {
            assert.equal(forecast_result.models[kernel].status, 'SUCCESS');
            assert.equal(forecast_result.models[kernel].type, 'TimeSeries1D');
            assert.equal(forecast_result.models[kernel].kernel, kernel);

            assert.include(forecast_result.model_keys, forecast_result.models[kernel].model_key);

            // TODO: there's no immediate way to fetch the generated in-sample data key
            // assert.equal(forecast_result.models[kernel].data_key, '');

            assert(forecast_result.models[kernel].parameters);
            assert(forecast_result.models[kernel].n_ahead);
            assert(forecast_result.models[kernel].fit);
            assert(forecast_result.models[kernel].fit_variance);
            assert(forecast_result.models[kernel].predicted);
            assert(forecast_result.models[kernel].predicted_variance);
            assert(forecast_result.models[kernel].BIC);
            assert(forecast_result.models[kernel].prediction_error);
            assert(forecast_result.models[kernel].log_likelihood);
          }

          done();
        }
      });
    });

    test('SE kernel forecast', function(done) {
      this.timeout(60000);

      datagami.timeseries.forecast({
        data_key: data_key,
        kernel: 'SE',               // TODO
        steps_ahead: 10,            // TODO
        parameters: [2.0, 25, 0.5], // TODO

        callback: function(forecast_result) {
          assert.equal(forecast_result.status, 'SUCCESS');
          assert.equal(forecast_result.type, 'TimeSeries1D');

          // for now, just check existence
          assert(forecast_result.parameters);
          assert(forecast_result.fit);
          assert(forecast_result.fit_variance);
          assert(forecast_result.predicted);
          assert(forecast_result.predicted_variance);

          // beyond this decimal place chai-stats will allow errors
          var params_decimal = 5;

          assert.deepAlmostEqual(forecast_result.parameters, [ 2.20862307669555, 21.7088540989884, 0.144386255514506 ], params_decimal);
          assert.almostEqual(forecast_result.log_likelihood, -18.2418632905999, params_decimal);

          // since these numbers are all in the order of 10^14 anyway
          var values_decimal = -9;

          assert.deepAlmostEqual(forecast_result.fit, [14085912347933.5, 13993465251950.9, 13870850348127.6, 13718918742001.3, 13538848929831, 13332132153447.3, 13100552136208, 12846159464146.9, 12571240994518.4, 12278284786471.2, 11969941152714.3, 11648980524100, 11318248898594.8, 10980621709995.5, 10638956998168.5, 10296048790157.7, 9954581609287.68, 9617087016899.17, 9285903058650.84, 8963137434914.35, 8650635143712.87, 8349951256388.55, 8062329382654.65, 7788686265185.34, 7529602817064.53, 7285321781127.6, 7055752051577.46, 6840479558414.56, 6638784477413.98, 6449664395775.2, 6271862939201.61, 6103903252865, 5944125629042.24, 5790728490396.71, 5641811871749.57, 5495422496155, 5349599514100, 5202419968149.2, 5052043059332.65, 4896752325500.09, 4734994894788.12, 4565417047830.76, 4386895408591.27, 4198563183551.04, 3999830980001.31, 3790401853674.94, 3570280361104.8, 3339775519965.9, 3099497708332.89, 2850349658376.26, 2593511818790.82, 2330422470627.91, 2062753080899.45], values_decimal);
          // assert.deepAlmostEqual(forecast_result.fit_variance, [18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7, 18040342445858.7], values_decimal);
          assert.deepAlmostEqual(forecast_result.predicted, [1792379564044.85, 1521349547932.47, 1251847610115.39, 986157666778.368, 726624361476.885, 475613824480.383, 235474626153.866, 8499659809.66699, -203110351453.433, -397281083725.698], values_decimal);
          // assert.deepAlmostEqual(forecast_result.predicted_variance, [38894009941.0092, 58152830891.6502, 85476455700.2945, 123026465072.353, 173223480141.16, 238710346691.487, 322300379956.872, 426911559508.325, 555488413898.686, 710914131701.877], values_decimal);

          assert.equal(forecast_result.kernel, 'SE');
          assert.equal(forecast_result.data_key, data_key);
          assert.equal(forecast_result.steps_ahead, 10);

          done();
        }
      });
    });
  });
});
