const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: fs.createReadStream(`${__dirname}/resources/zuordnung_plz_ort.csv`),
    crlfDelay: Infinity
});
let line_number = 0;
let zip_to_city = [];
rl.on('line', line => {
    line = line.trim();
    if (line_number++ === 0 || line === '') return;
    let contents = line.split(',');
    if (contents.length > 4) {
        contents.forEach((value, index, array) => {
            if (value == null && index < 5) {
                if (index < 4) {
                    array[index] = array[index + 1];
                }
                array[index + 1] = null;
                return;
            }
            if (value.indexOf('"') !== -1) {
                array[index] = `${value}${array[index + 1]}`;
                array[index + 1] = null;
            }
        });
    }
    zip_to_city.push({
        city: contents[1].trim(),
        zip: contents[2].trim(),
        state: contents[3].trim()
    });
});
rl.on('close', () => {
    fs.writeFileSync(`${__dirname}/../build/zip_to_city.js`, `module.exports = ${JSON.stringify(zip_to_city)};`);
    console.log('Preprocessor finished');
});