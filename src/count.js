var base64 = require('base64');

var JSONP_CB_PREFIX = "LFCommentCount";
var JSONP_CB_RAND_MAX = 100000;
// LF_DOMAIN is used as the host for the ncomments API call if one cannot be extracted from the script tag src
var LF_DOMAIN = 'livefyre.com';
var LF_NCOMMENTS_PATH = '/api/v1.1/public/comments/ncomments/{hash}.json';
// DEFAULT_RETRY_TIMEOUT is the default number of seconds to wait if the ncomments request returns a 503 envelope
var DEFAULT_RETRY_TIMEOUT = 500;
var MAX_FETCH_ATTEMPTS = 5;

/**
 * Fetch comment counts for the provided collections from the server,
 * then execute `cb` with err, arrayOfCounts
 *
 * @param collections (optional): Array of objects with siteId and articleId keys or object with siteId->articleId->[elements] mapping
 * @param cb: A callback Function.
 */
var count = module.exports = function count(collections, cb) {
    var attempts = 0;

    // If passed article object, convert to list
    if ( ! isArray(collections)) {
        collections = collectionsObjectToList(collections);
    }
    
    if ( ! (collections && collections.length)) {
        return cb(new Error('No Collections passed to fetch counts from'));
    }

    var network = collections[0].network;
    var domain = network || LF_DOMAIN;
    var endpoint = "http://bootstrap.{domain}{path}",
        hash = hashCollections(collections);

    if (! hash) {
        return;
    }

    // Create the URL from template
    endpoint = endpoint.replace('{domain}', domain)
                       .replace('{path}', LF_NCOMMENTS_PATH)
                       .replace('{hash}', hash);
    
    jsonp(endpoint, {}, onResponse);

    function onResponse(response) {
        attempts = attempts + 1;

        if (response.status === 'ok') {
            var articleCounts = ensureCorrectCollectionsObject(response.data);
            var allCounts = [];
            collections.forEach(function (article) {
                var siteCounts = articleCounts[article.siteId];
                var theseCounts = siteCounts && siteCounts[article.articleId];
                var info = extend({}, theseCounts);
                var err;
                if ( ! theseCounts) {
                    err = new Error("Couldn't get counts for collection: " + article);
                    err.collection = article;
                    allCounts.push(err);
                    return;
                }
                allCounts.push(extend(info, article));
            });
            // This way callback function has access to elements already
            cb.call(null, allCounts);
        } else if (parseInt(response.code, 10) === 503 && attempts < MAX_FETCH_ATTEMPTS) {
            // Wait a bit and try again
            setTimeout(function() {
                jsonp(endpoint, {}, onResponse);
            }, (response.data.wait || DEFAULT_RETRY_TIMEOUT));
        }
    }
};

/**
 * Returns a count function, that, as long as it continues to be invoked, will not be triggered.
 * The function will be called after it stops being called for N milliseconds.
 * @param func {function} The function to debounce
 * @param wait {number} The number of milliseconds to wait for execution of func
 * @return {function} A debounced version the collectionCounter.count function
 */
count.debounced = function (wait) {
    var calls = [];
    var timeout, result;
    // Call count once and invoke all the right callbacks from previous calls
    function fetchAll() {
        var theseCalls = calls.slice();
        // reset calls for further debounced invocations
        calls = [];
        var collectionsPerCall = theseCalls.map(function (call) {
            return call[0];
        });
        var allCollections = collectionsPerCall.reduce(function (all, moreCollections) {
            all.push.apply(all, moreCollections);
            return all;
        }, []);
        // Do one request for allCollections
        count(allCollections, function (counts) {
            // Now we need to invoke the cb for each of the calls
            // with the appropriate subset of counts
            invokeCallsWithCounts(theseCalls, counts);
        });
    }
    function debouncedCount(collections, cb) {
        calls.push(arguments);

        var context = this,
            args = arguments;
        var later = function() {
            timeout = null;
            result = fetchAll.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        return result;
    }
    // Given an array of calls and an array of counts from count(),
    // figure out which counts go with with call and invoke them
    function invokeCallsWithCounts(calls, counts) {
        var countsIndex = 0;
        calls.forEach(function (call) {
            var collections = call[0];
            var numCollections = collections.length;
            var callback = call[1];
            var countsForThisCall = counts.slice(countsIndex, countsIndex + numCollections);
            countsIndex += numCollections;
            callback.call({}, countsForThisCall);
        });
    }
    return debouncedCount;
};

/**
 * Given an array and an item, tests whether the item is in the Array.
 * Used because IE doesn't have Array.prototype.indexOf
 *
 * @param array: An array
 * @param item: Object to test if it's in the array
 */
var contains = function(array, item) {
    var i = array.length;
    while (i--) {
        if (array[i] === item) {
            return true;
        }
    }
    return false;
};

/**
 * Provided a list of collections, this returns the hash that must be passed
 * to the ncomments API endpoint
 *
 * @param collections: A list or object indicating a collection of collections
 */
var hashCollections = function(collections) {
    var pairs = [],
        key,
        mapping = {};
    if (collections.length === 0) {
        return null;
    }
    // Create articleId/siteId pairs
    for (var i=0, len=collections.length, arr, article; i<len; i++) {
        article = collections[i];
        arr = mapping[article.siteId] || [];
        if (!contains(arr, article.articleId)) {
            arr.push(article.articleId);
        }
        mapping[article.siteId] = arr;
    }
    for (key in mapping) {
        if (mapping.hasOwnProperty(key)) {
            pairs.push(key +':'+ mapping[key].join(','));
        }
    }
    return base64.btoa(pairs.join('|'));
};

var collectionsObjectToList = function(article_object) {
    var article_list = [],
        site,
        obj_to_push,
        article_info;
    for (var siteId in article_object) { if (article_object.hasOwnProperty(siteId)) {
        site = article_object[siteId];
        for (var articleId in site) { if (site.hasOwnProperty(articleId)) {
            article_info = site[articleId];
            obj_to_push = extend({
                articleId: articleId,
                siteId: siteId
            }, article_info);
            article_list.push(obj_to_push);
        }}
    }}
    return article_list;
};
var jsonp = function(url, args, callback) {
    if (typeof(args)==='undefined') {
        args = {};
    }
    var jsonpcb;
    // Create jsonp callback (like 'LFCommentCount12515')
    jsonpcb = JSONP_CB_PREFIX+Math.floor(Math.random()*JSONP_CB_RAND_MAX);
    window[jsonpcb] = callback;
    // Add jsonp callback to URL args
    args.callback = jsonpcb;
    
    if (url.indexOf('?') < 1) {
        url = url + "?";
    }
    for (var arg in args) {
        if (args.hasOwnProperty(arg)) {
            url = url + "&" + escape(arg) + "=" + escape(args[arg]);
        }
    }
    var headID = document.getElementsByTagName("head")[0];
    var newScript = document.createElement('script');
    newScript.type = 'text/javascript';
    newScript.src = url;
    headID.appendChild(newScript);
};

var extend = function(obj1, obj2) {
    var obj3 = {};
    // First basically just copy obj1 into obj3
    for (var key1 in obj1) {
        if (obj1.hasOwnProperty(key1)) {
            obj3[key1] = obj1[key1];
        }
    }
    // Then add obj2 into obj3, not overwriting arrays
    for (var key2 in obj2) {
        if (!obj2.hasOwnProperty(key2)) {
            continue;
        }
        if (isArray(obj2[key2]) && isArray(obj3[key2])) {
            obj3[key2] = obj3[key2].concat(obj2[key2]);
        } else {
            obj3[key2] = obj2[key2];
        }
    }
    return obj3;
};

var ensureCorrectCollectionsObject = function(article_counts) {
    for (var siteId in article_counts) {
        if (!article_counts.hasOwnProperty(siteId)) {
            continue;
        }
        var site = article_counts[siteId];
        for (var articleId in site) {
            if (!site.hasOwnProperty(articleId)) {
                continue;
            }
            if (typeof(site[articleId])!=='object') {
                site[articleId] = {count: site[articleId]};
            }
        }
    }
    return article_counts;
};
