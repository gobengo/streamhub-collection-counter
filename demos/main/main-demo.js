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

counter.count(collections, function (counts) {
    console.log('counts');
    console.log(counts);
});