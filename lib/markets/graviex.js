var request = require('request');

var base_url = 'https://graviex.net/webapi/v3';

function get_summary(coin, exchange, cb) {
  var summary = {};
  var url=(base_url + '/tickers/' + coin.concat(exchange)).toLowerCase();
  request({"rejectUnauthorized": false, uri: url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else if (body.error !== true) {

      summary['bid'] = parseFloat(body['buy']).toFixed(9);
      summary['ask'] = parseFloat(body['sell']).toFixed(9);
      request({"rejectUnauthorized": false, uri: url , json: true}, function (error, response, body) {
        if (error) {
          return cb(error, null);
        } else if (body.error !== true) {
          summary['volume'] = parseFloat(body['volume']);
          summary['volume_btc'] = parseFloat(body['volume2']);
          summary['high'] = parseFloat(body['high']).toFixed(9);
          summary['low'] = parseFloat(body['low']).toFixed(9);
          summary['last'] = parseFloat(body['last']).toFixed(9);
          return cb(null, summary);
        } else {
          return cb(error, null);      
        }
      });
    } else {
      return cb(error, null);
    }
  });   
}
function get_trades(coin, exchange, cb) {
	  var req_url = (base_url + '/trades_simple.json?market=' + coin.concat(exchange)).toLowerCase();
  request({ uri: req_url, json: true }, function (error, response, body) {
        if(error)
          return cb(error, null);
        else if (body.error !== true) {
          var tTrades = body;
          var trades = [];
          for (var i = 0; i < tTrades.length; i++) {
              var Trade = {
                  ordertype: tTrades[i].type.charAt(0).toUpperCase() + tTrades[i].type.substring(1).toLowerCase(),
                  amount: parseFloat(tTrades[i].amount).toFixed(4),
                  price: parseFloat(tTrades[i].price).toFixed(9),
                  total: (parseFloat(tTrades[i].amount).toFixed(4) * parseFloat(tTrades[i].price)).toFixed(9),
                  timestamp: formatTime(tTrades[i].date)
              }
              trades.push(Trade);
          }
	          return cb(null, trades);
      } else {
          return cb(body.Message, null);
      }
  });
}

function formatTime(timestamp){
    var raw = new Date(timestamp*1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = raw.getFullYear();
    var month = months[raw.getMonth()];
    var date = ("0" +  raw.getDate()).substr(-2);	
    var hour = ("0" + raw.getHours()).substr(-2);
    var min = ("0" + raw.getMinutes()).substr(-2);
    var sec = ("0" + raw.getSeconds()).substr(-2);
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
}

function get_orders(coin, exchange, cb) {
        var req_url = (base_url + '/depth.json?market=' + coin.concat(exchange)).toLowerCase();
	request({ uri: req_url, json: true }, function (error, response, body) {
        if(error)
            return cb(error, null);
        else if (body.error !== true) {
            var buyorders = body['bids'];
            var sellorders = body['asks'];

            var buys = [];
            var sells = [];
            if (buyorders.length > 0){
                for (var i = 0; i < buyorders.length; i++) {
                    var order = {
                        amount: parseFloat(buyorders[i]['1']).toFixed(4),
                        price: parseFloat(buyorders[i]['0']).toFixed(9),
                        total: parseFloat(buyorders[i]['1']).toFixed(4) * parseFloat(buyorders[i]['0']).toFixed(9)
                    }
                   buys.push(order);
                  }
                  } else {}
                if (sellorders.length > 0) {
                for (var x = 0; x < sellorders.length; x++) {
                    var order = {
                        amount: parseFloat(sellorders[x]['1']).toFixed(9),
                        price: parseFloat(sellorders[x]['0']).toFixed(9),
                        total: parseFloat(sellorders[x]['1']).toFixed(9) * parseFloat(sellorders[x]['0']).toFixed(9)
                    }
                    sells.push(order);
                }
            } else {
            }
            return cb(null, buys, sells);
            } else {
            return cb(body.Message, [], [])
        }
     });
}

module.exports = {
  get_data: function(coin, exchange, cb) {
    var error = null;
     get_orders(coin, exchange, function(err, buys, sells) {
     if (err) { error = err; }
      get_trades(coin, exchange, function(err, trades) {
        if (err) { error = err; }
        get_summary(coin, exchange,  function(err, stats) {
          if (err) { error = err; }
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};
