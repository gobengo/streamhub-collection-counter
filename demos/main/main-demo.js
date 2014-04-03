var counter = require('collection-counter');

var collections = [{
    network: 'labs.fyre.co',
    siteId: '320568',
    articleId: 'myoscarphoto'
},{
    network: 'labs.fyre.co',
    siteId: '320568',
    articleId: 'custom-1379372287037'
}];

var count = counter.count.debounced(2000);

collections.forEach(function (collection) {
    count([collection, {}], function (counts) {
        console.log('counts', counts);
    });
});