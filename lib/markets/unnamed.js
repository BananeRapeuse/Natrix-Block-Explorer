var request = require('request');

var base_url = 'https://api.unnamed.exchange/v1/Public';

function get_summary(coin, exchange, cb) {
  var summary = {};
  var url=base_url + '/Ticker?market=' + (coin + '_' + exchange).toUpperCase();
  request({uri: url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else if (body.error !== true) {
        summary['bid'] = parseFloat(body.highestBuy).toFixed(8);
        summary['ask'] = parseFloat(body.lowestSell).toFixed(8);
        summary['volume'] = parseFloat(body.volume).toFixed(8);
        summary['volume_btc'] = parseFloat(body.BaseVolume).toFixed(8);
        summary['low'] = parseFloat(body.high).toFixed(8);
        summary['high'] = parseFloat(body.low).toFixed(8);
        summary['last'] = parseFloat(body.close).toFixed(8);
        summary['change'] = parseFloat(body.change);
      return cb(null, summary);	    
    } else {
      return cb(error, null);
    }
  });   
}
function get_trades(coin, exchange, cb) {
	  var req_url = base_url + '/TradeHistory?market=' + (coin + '_' + exchange).toUpperCase();
  request({ uri: req_url, json: true }, function (error, response, body) {
        if(error)
          return cb(error, null);
        else if (body.error !== true) {
          var tTrades = body;
          var trades = [];
          for (var i = 0; i < tTrades.length; i++) {
              var Trade = {
                  ordertype: tTrades[i].type.charAt(0).toUpperCase() + tTrades[i].type.substring(1).toLowerCase(),
                  amount: parseFloat(tTrades[i].amount).toFixed(8),
                  price: parseFloat(tTrades[i].price).toFixed(8),
                  total: (parseFloat(tTrades[i].amount).toFixed(8) * parseFloat(tTrades[i].price)).toFixed(8),
                  timestamp: formatTime(tTrades[i].timestamp)
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
        var req_url = base_url + '/OrderBook?market=' + (coin + '_' + exchange).toUpperCase();
	request({ uri: req_url, json: true }, function (error, response, body) {
        if(error)
            return cb(error, null);
        else if (body.error !== true) {
            var buyorders = body['buy'];
            var sellorders = body['sell'];

            var buys = [];
            var sells = [];
            if (buyorders.length > 0){
                for (var i = 0; i < buyorders.length; i++) {
                    var order = {
                        amount: parseFloat(buyorders[i].amount).toFixed(8),
                        price: parseFloat(buyorders[i].price).toFixed(8),
                        total: parseFloat(buyorders[i].amount).toFixed(8) * parseFloat(buyorders[i].price).toFixed(8)
                    }
                   buys.push(order);
                  }
                  } else {}
                if (sellorders.length > 0) {
                for (var x = 0; x < sellorders.length; x++) {
                    var order = {
                        amount: parseFloat(sellorders[x].amount).toFixed(8),
                        price: parseFloat(sellorders[x].price).toFixed(8),
                        total: parseFloat(sellorders[x].amount).toFixed(8) * parseFloat(sellorders[x].price).toFixed(8)
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
