# ZipSearch 1.0.0

## Features
- search city by zipcode (Germany only)
- ready to use for autocompletion
- no external dependencies / no ajax calls
- easy to install
- small code size (~160kb) when compressed with gzip
- usable down to IE11

## Installation
Either download the latest release directly from http://www.das-mensch.de/downloads/zipsearch-1.0.0.js, or clone/download this repo then run ```npm run build``` and finally copy the file ```zipsearch-1.0.0.js``` from the dist directory.

## Usage
The plugin will register itself under ```de.dasmensch```. You can access the zip search in the browser as follows
```$javascript
var citiesForZipCodesStartingWith80 = de.dasmensch.searchByZip('80');
// Each city-object has the following structure:
{
    cityName: 'München',
    zip: '80331',
    stateName: 'Bayern'
}
```

## Demo
http://www.das-mensch.de/demo/zipsearch.html

## Thanks to
- The OSM-Team
- https://www.suche-postleitzahl.org/
- https://ourcodeworld.com/articles/read/164/how-to-convert-an-uint8array-to-string-in-javascript
