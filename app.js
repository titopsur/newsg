
//var FeedParser = require('feedparser');
//var Request = require('request');
//
//Request(url)
//    .pipe(new FeedParser())
//    .on('error', function(error) {
//        var a = 1;
//    })
//    .on('meta', function(meta) {
//        var b = 1;
//    })
//    .on('readable', function() {
//        var c = 1;
//    });


//var FeedSub = require('feedsub');
//
//var reader = new FeedSub(url, {
//    interval: 1, // check feed every 10 minutes-
//    autoStart: true
//});
//
//reader.on('item', function(item) {
//  console.log('Got item!');
//  console.dir(item);
//});
//
//reader.start();


var request = require('request'), 
    cheerio = require('cheerio'), 
    async = require('async'), 
    format = require('util').format,
    fs = require('fs'),
    uuid = require('node-uuid'),
    FeedParser = require('feedparser'),
    MongoClient = require('mongodb').MongoClient;

//for a list of rss urls:
// - request each url on every X minutes - ready
// - download the result in a file - ready
// - use the rss library to parse the downloaded files


var urls = [
    'http://feeds.bbci.co.uk/news/technology/rss.xml',
    'http://rss.cnn.com/rss/edition_technology.rss',
    'http://feeds.reuters.com/reuters/technologyNews.rss'
];

downloadRSS();
setInterval(downloadRSS, 1000 * 60 * 5 /*5 minutes*/);

function downloadRSS() {
    MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
        if (err) throw err;
        
        for (u in urls) {
            request(urls[u], function(e, response, body) {
                if (e) throw e;
                var filePath = "data/" + uuid.v1();
                fs.writeFile(filePath, body, function(err) {
                    if (err) throw err;
                    console.log('%s savedd.', urls[u]);
                });

                fs.createReadStream(filePath).on('error', function(error) {
                    console.error(error);
                }).pipe(new FeedParser()).on('error', function(error) {
                    console.error(error);
                }).on('meta', function(meta) {
                    console.log('===== %s =====', meta.title);
                }).on('readable', function() {
                    var stream = this;
                    var item;
                    while (item = stream.read()) {
                        //var news = JSON.stringify(item);
                        db.collection('test_insert').insert(item, function(err2, objects) {
                            if (err2) console.warn(err.message);
                        });
                        console.log('Got article: %s', item.title || item.description);
                    }
                });

            });
        }
    });
}

//async.eachLimit(reddits, concurrency, function (reddit, next) {
//    var url = format('http://reddit.com/r/%s', reddit);
//    request(url, function (err, response, body) {
//        if (err) throw err;
//        var $ = cheerio.load(body);
//        $('a.title').each(function () {
//            console.log('%s (%s)', $(this).text(), $(this).attr('href'));
//        });
//        next();
//    });
//});
