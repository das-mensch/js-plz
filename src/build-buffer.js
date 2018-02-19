const fs = require('fs');
const PatriciaIndex = require('./PatriciaIndex');
let masterdata = require(`${__dirname}/../build/zip_to_city`);
let version = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`)).version;

let city_string_buffer = Buffer.alloc(0);
let state_string_buffer = Buffer.alloc(0);
let city_name_to_offset_map = new Map();
let state_name_to_offset_map = new Map();
let city_name_set = new Set();
let state_name_set = new Set();

masterdata.forEach(zip_to_city => {
    city_name_set.add(zip_to_city.city);
    state_name_set.add(zip_to_city.state);
});

let offset = 0;
city_name_set.forEach(city_name => {
    const city_name_buffer = Buffer.from(city_name);
    const buffer_length = city_name_buffer.length;
    const city_length_buffer = Buffer.alloc(1);
    city_length_buffer.writeUInt8(buffer_length, 0);
    city_string_buffer = Buffer.concat([city_string_buffer, city_length_buffer, city_name_buffer]);
    city_name_to_offset_map.set(city_name, offset);
    offset += buffer_length + 1;
});

state_name_set.forEach(state_name => {
    const state_name_buffer = Buffer.from(state_name);
    const buffer_length = state_name_buffer.length;
    const state_length_buffer = Buffer.alloc(1);
    state_length_buffer.writeUInt8(buffer_length, 0);
    state_string_buffer = Buffer.concat([state_string_buffer, state_length_buffer, state_name_buffer]);
    state_name_to_offset_map.set(state_name, offset);
    offset += buffer_length + 1;
});


let patricia_index = new PatriciaIndex(13);
masterdata.forEach(zip_to_city => {
    let city_offset = city_name_to_offset_map.get(zip_to_city.city);
    let state_offset = state_name_to_offset_map.get(zip_to_city.state);
    let id_buffer = Buffer.alloc(13);
    id_buffer.writeUInt32LE(city_offset, 0);
    id_buffer.writeUInt32LE(state_offset, 4);
    id_buffer.write(zip_to_city.zip, 8, 5);
    patricia_index.insert(zip_to_city.zip, id_buffer);
});

patricia_index.pack();
let patriciaBuffer = patricia_index.bufferify();
let patLengthBuffer = Buffer.alloc(4);
patLengthBuffer.writeUInt32LE(patriciaBuffer.length, 0);
const fullBuffer = Buffer.concat([patLengthBuffer, patricia_index.bufferify(), city_string_buffer, state_string_buffer]);
fs.writeFileSync(
    `${__dirname}/../dist/zipsearch-${version}.js`,
    fs.readFileSync(`${__dirname}/resources/zipsearch.in.js`, { encoding: 'utf8' }).replace('###BASE64STRING###', fullBuffer.toString('base64'))
);
console.log('Index build successfully');
