# sqlite3-as-promised

Wrap [node-sqlite3](https://github.com/developmentseed/node-sqlite3)'s async methods with the ["q" style promises](https://github.com/kriskowal/q).

## Getting Started
Install the module with: `npm install sqlite3-as-promised`

```javascript
var sap = require('sqlite3-as-promised');
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database(':memory:');

//init, etc.

sap.all(db, 'SELECT * FROM table')
    .then(function(rows) {
            //Do something with rows
        });
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](https://github.com/gruntjs/grunt).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013 Elliott B. Edwards  
Licensed under the MIT license.
