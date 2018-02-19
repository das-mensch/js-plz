class Node {
    constructor(pt) {
        this._keys = new Map();
        this._ids = new Set();
        this._pt = pt;
        this._id = this._pt.counter;
    }

    get id() {
        return this._id;
    }

    get keys() {
        return this._keys;
    }

    get ids() {
        return this._ids;
    }

    addKey(key) {
        if (!this._keys.has(key)) {
            this._keys.set(key, new Node(this._pt, this));
        }
    }

    addId(id) {
        this._ids.add(id);
    }

    pack() {
        let currentMap = new Map();
        this._keys.forEach((value, key) => {
            currentMap.set(key, value);
        });
        this._keys.forEach((value, key) => {
            if (value.ids.size !== 0) {
                return;
            }
            value.keys.forEach((subValue, subKey) => {
                currentMap.set(Buffer.from(`${key}${subKey}`), subValue);
            });
            currentMap.delete(key);
        });
        this._keys = currentMap;
        let anotherPass = false;
        this._keys.forEach(value => {
            if (value.ids.size === 0) anotherPass = true;
        });
        if (anotherPass) {
            this.pack();
        }
        this._keys.forEach(value => {
            value.pack();
        });
    }

    bufferify(buffer) {
        let countBuffer = Buffer.alloc(8);
        countBuffer.writeUInt32LE(this._id, 0);
        countBuffer.writeUInt16LE(this._keys.size, 4);
        countBuffer.writeUInt16LE(this._ids.size, 6);
        let keyBuffer = Buffer.alloc(0);
        this._keys.forEach((value, key) => {
            let keySizeBuffer = Buffer.alloc(1);
            let keyIdBuffer = Buffer.alloc(4);
            keySizeBuffer.writeUInt8(key.length, 0);
            keyIdBuffer.writeUInt32LE(value.id, 0);
            keyBuffer = Buffer.concat([keyBuffer, keySizeBuffer, Buffer.from(key), keyIdBuffer]);
        });
        let idBuffer = Buffer.alloc(0);
        this._ids.forEach(id => {
            idBuffer = Buffer.concat([idBuffer, id]);
        });
        buffer = Buffer.concat([countBuffer, keyBuffer, idBuffer]);
        this._keys.forEach(value => {
            buffer = Buffer.concat([buffer, value.bufferify(buffer)]);
        });
        return buffer;
    }
}

class PatriciaIndex {
    constructor(dataSize) {
        this._dataSize = dataSize;
        this._counter = 0;
        this._root = new Node(this);
    }

    get dataSize() {
        return this._dataSize;
    }

    get counter() {
        return this._counter++;
    }

    insert(string, id) {
        let buffer = Buffer.from(string);
        let node = this._root;
        for (let i = 0; i < buffer.length - 1; i++) {
            let byteBuffer = buffer.slice(i, i + 1).toString();
            node.addKey(byteBuffer);
            node = node.keys.get(byteBuffer);
        }
        node.addId(id);
    }

    pack() {
        this._root.pack();
    }

    bufferify() {
        return this._root.bufferify(Buffer.alloc(0));
    }
}

module.exports = PatriciaIndex;
