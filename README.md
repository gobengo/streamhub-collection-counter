# streamhub-collection-counter

Count the number of items in a set of StreamHub Collections

Use it like this

```javascript
var counter = require('collection-counter');

var collectionInfo = {
    network: 'labs.fyre.co',
    app: 'main',
    siteId: '320568',
    articleId: 'myoscarphoto'
};

counter.count([collectionInfo], function (counts) {
    console.log('counts');
    console.log(counts);
});
```

