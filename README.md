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

Sometimes it is nice to be able to call a single function many times, each
with a different set of Collections, but make sure that the network traffic
to StreamHub APIs is as light as possible.

For example, you may have a function that renders one Collection, and in that
function you would like to go get the number of items in that Collection.
If your page is going to call this render function 100 times back-to-back,
it would do 100 AJAX calls.

For this, you can make a debounced version of the `counter.count` function.
This one will only make the API request after not being called for 2 seconds.

    var count = counter.count.debounced(2000);
    count([collection1Info], function (counts1) {
        console.log('collection1', counts);
    });
    count([collection2Info], function (counts) {
        console.log('collection2', counts2);
    });
