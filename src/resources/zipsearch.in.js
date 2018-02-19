function utf8ArrayToStr(array) {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while (i < len) {
        c = array[i++];
        switch(c >> 4) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                // 0xxxxxxx
                out += String.fromCharCode(c);
                break;
            case 12:
            case 13:
                // 110x xxxx   10xx xxxx
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
        }
    }
    return out;
}
var base64String = '###BASE64STRING###';
var binary_string =  window.atob(base64String);
base64String = '';
var len = binary_string.length;
var bytes = new Uint8Array(len);
for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
}
var mainBuffer = bytes.buffer;
var mainDataView = new DataView(mainBuffer);
var indexSize = mainDataView.getUint32(0, true);
var patriciaDataView = new DataView(mainBuffer.slice(4, 4 + indexSize));
var stringBufferView = new DataView(mainBuffer.slice(indexSize + 4));

var nodes = new Map();
var cityNames = new Map();
var stateNames = new Map();
var offset = 0;
while (offset < indexSize) {
    var nodeId = patriciaDataView.getUint32(offset, true);
    var nodeKeyCount = patriciaDataView.getUint16(offset + 4, true);
    var nodeIdCount = patriciaDataView.getUint16(offset + 6, true);
    var node = {
        nodeId: nodeId,
        keys: [],
        ids: []
    };
    offset += 8;
    for (var i = 0; i < nodeKeyCount; i++) {
        var keySize = patriciaDataView.getUint8(offset);
        var key = String.fromCharCode.apply(null, new Uint8Array(patriciaDataView.buffer.slice(offset + 1, offset + 1 + keySize)));
        var keyRef = patriciaDataView.getUint32(offset + 1 + keySize, true);
        offset += keySize + 5;
        node.keys.push({
            key: key,
            keyRef: keyRef
        });
    }
    for (var i = 0; i < nodeIdCount; i++) {
        var cityOffset = patriciaDataView.getUint32(offset, true);
        var stateOffset = patriciaDataView.getUint32(offset + 4, true);
        var zip = String.fromCharCode.apply(null, new Uint8Array(patriciaDataView.buffer.slice(offset + 8, offset + 8 + 5)));
        offset += 13;
        cityNames.set(cityOffset, null);
        stateNames.set(stateOffset, null);
        node.ids.push({
            stateOffset: stateOffset,
            cityOffset: cityOffset,
            zip: zip
        });
    }
    nodes.set(nodeId, node);
}

cityNames.forEach(function(value, key, map) {
    map.set(key, utf8ArrayToStr(new Uint8Array(stringBufferView.buffer.slice(key + 1, key + 1 + stringBufferView.getUint8(key)))));
});

stateNames.forEach(function(value, key, map) {
    map.set(key, utf8ArrayToStr(new Uint8Array(stringBufferView.buffer.slice(key + 1, key + 1 + stringBufferView.getUint8(key)))));
});


function Node(nodeId, keys, datas) {
    this.nodeId = nodeId;
    this.keys = keys;
    this.datas = datas;
}

Node.prototype.resolve = function() {
    var resolvedKeys = new Map();
    var resolvedDatas = new Set();
    for (var i = 0; i < this.keys.length; i++) {
        resolvedKeys.set(this.keys[i].key, nodes.get(this.keys[i].keyRef));
    }
    this.keys = resolvedKeys;
    for (var i = 0; i < this.datas.length; i++) {
        var data = {
            cityName: cityNames.get(this.datas[i].cityOffset),
            stateName: stateNames.get(this.datas[i].stateOffset),
            zip: this.datas[i].zip
        };
        resolvedDatas.add(data);
    }
    this.datas = resolvedDatas;
    this.keys.forEach(function(value, key, map) {
        var node = new Node(value.nodeId, value.keys, value.ids);
        node.resolve();
        map.set(key, node);
    });
};

Node.prototype.find = function(searchString, array) {
    if (this.keys.size === 0 && this.datas.size > 0) {
        this.datas.forEach(function(value) {
            if (value.zip.indexOf(searchString) === 0) {
                array.push(value);
            }
        });
    }
    if (this.keys.size === 0) {
        return array;
    }
    this.keys.forEach(function(value, key) {
        if (searchString.length > key.length || key.indexOf(searchString) === 0) {
            value.find(searchString, array);
        }
    });
    return array;
};

function PatriciaIndex(root) {
    this.root = root;
    this.root.resolve();
}

PatriciaIndex.prototype.find = function(searchString) {
    if (searchString.trim() === '') return [];
    return this.root.find(searchString, []);
};

var pt = new PatriciaIndex(new Node(nodes.get(0).nodeId, nodes.get(0).keys, nodes.get(0).ids));
mainBuffer = null;
stringBufferView = null;
patriciaDataView = null;

var namespace = function(namespace) {
    var currentNamespace = window;
    namespace.split('.').forEach(function(part) {
        if (!currentNamespace.hasOwnProperty(part)) {
            currentNamespace[part] = {};
        }
        currentNamespace = currentNamespace[part];
    });
    return currentNamespace;
}('de.dasmensch');

namespace.searchByZip = function(searchString) {
    return pt.find(searchString);
};
