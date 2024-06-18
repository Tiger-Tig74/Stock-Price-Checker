const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  this.timeout(5000);

  let firstStockLikes;

  suite('GET /api/stock-prices => stockData object', function() {
    
    test('Viewing one stock: GET request to /api/stock-prices/', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'goog' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, 'stockData');

          assert.property(res.body.stockData, 'stock');
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          assert.equal(res.body.stockData.stock, 'GOOG');          
          done();
        });
    });

    test('Viewing one stock and liking it: GET request to /api/stock-prices/', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'goog', like: true })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, 'stockData');

          assert.property(res.body.stockData, 'stock');
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          assert.equal(res.body.stockData.stock, 'GOOG');          
          firstStockLikes = res.body.stockData.likes;
          done();
        });
    });

    test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: 'goog', like: true })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, 'stockData');

          assert.property(res.body.stockData, 'stock');
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          assert.equal(res.body.stockData.stock, 'GOOG');          
          assert.equal(res.body.stockData.likes, firstStockLikes); // Likes should not increase
          done();
        });
    });

    test('Viewing two stocks: GET request to /api/stock-prices/', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: ['goog', 'msft'] })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, 'stockData');
          assert.isArray(res.body.stockData);
          assert.equal(res.body.stockData.length, 2);
          
          assert.property(res.body.stockData[0], 'stock');
          assert.property(res.body.stockData[0], 'price');
          assert.property(res.body.stockData[0], 'rel_likes');
    
          assert.property(res.body.stockData[1], 'stock');
          assert.property(res.body.stockData[1], 'price');
          assert.property(res.body.stockData[1], 'rel_likes');
    
          // Ensure the rel_likes calculation is correct
          assert.equal(res.body.stockData[0].rel_likes, 4);
          assert.equal(res.body.stockData[1].rel_likes, -4);
    
          done();
        });
    });    

    test('Viewing two stocks and liking them: GET request to /api/stock-prices/', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({ stock: ['goog', 'msft'], like: true })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, 'stockData');
          assert.isArray(res.body.stockData);
          assert.equal(res.body.stockData.length, 2);

          assert.property(res.body.stockData[0], 'stock');
          assert.property(res.body.stockData[0], 'price');
          assert.property(res.body.stockData[0], 'rel_likes');

          assert.property(res.body.stockData[1], 'stock');
          assert.property(res.body.stockData[1], 'price');
          assert.property(res.body.stockData[1], 'rel_likes');

          done();
        });
    });
  });
});
