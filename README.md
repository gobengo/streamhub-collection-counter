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
`counts` is an array filled with obects like

```json
{
    network: "labs.fyre.co"
    siteId: "320568"
    articleId: "custom-1379372287037"
    total: 49
    facebook: 0
    feed: 0
    instagram: 0
    livefyre: 49
    twitter: 0
}
```
