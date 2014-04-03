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

// Only one ajax request will actually happen
collections.forEach(function (collection) {
    count([collection, { woah: 'badData' }], function (counts) {
        console.log('counts', counts);
    });
});