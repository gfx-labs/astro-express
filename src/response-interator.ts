import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';

var canUseSymbol = typeof Symbol === 'function' &&
    typeof Symbol.for === 'function';

var canUseAsyncIteratorSymbol = canUseSymbol && Symbol.asyncIterator;

function isNodeResponse(value: any) {
    return !!value.body;
}

function isReadableStream(value: any) {
    return !!value.getReader;
}

function isAsyncIterableIterator(value: any) {
    return !!(canUseAsyncIteratorSymbol &&
        value[Symbol.asyncIterator]);
}

function isStreamableBlob(value: any) {
    return !!value.stream;
}

function isBlob(value: any) {
    return !!value.arrayBuffer;
}

function isNodeReadableStream(value: any) {
    return !!value.pipe;
}

function asyncIterator(source: any) {
    var _a: any;
    var iterator = source[Symbol.asyncIterator]();
    return _a = {
        next: function () {
            return iterator.next();
        }
    },
        _a[Symbol.asyncIterator] = function () {
            return this;
        },
        _a;
}

function readerIterator(reader: any) {
    var iterator:any = {
        next: function () {
            return reader.read();
        },
    };
    if (canUseAsyncIteratorSymbol) {
        iterator[Symbol.asyncIterator] = function () {
            return this;
        };
    }
    return iterator;
}

function promiseIterator(promise: any) {
    var resolved = false;
    var iterator:any = {
        next: function () {
            if (resolved)
                return Promise.resolve({
                    value: undefined,
                    done: true,
                });
            resolved = true;
            return new Promise(function (resolve, reject) {
                promise
                    .then(function (value: any) {
                        resolve({ value: value, done: false });
                    })
                    .catch(reject);
            });
        },
    };
    if (canUseAsyncIteratorSymbol) {
        iterator[Symbol.asyncIterator] = function () {
            return this;
        };
    }
    return iterator;
}

function nodeStreamIterator(stream: any) {
    var cleanup: any = null;
    var error:any = null;
    var done = false;
    var data: any[] = [];
    var waiting: any[] = [];
    function onData(chunk: any) {
        if (error)
            return;
        if (waiting.length) {
            var shiftedArr = waiting.shift();
            if (Array.isArray(shiftedArr) && shiftedArr[0]) {
                return shiftedArr[0]({ value: chunk, done: false });
            }
        }
        data.push(chunk);
    }
    function onError(err: any) {
        error = err;
        var all = waiting.slice();
        all.forEach(function (pair) {
            pair[1](err);
        });
        !cleanup || cleanup();
    }
    function onEnd() {
        done = true;
        var all = waiting.slice();
        all.forEach(function (pair) {
            pair[0]({ value: undefined, done: true });
        });
        !cleanup || cleanup();
    }
    cleanup = function () {
        cleanup = null;
        stream.removeListener("data", onData);
        stream.removeListener("error", onError);
        stream.removeListener("end", onEnd);
        stream.removeListener("finish", onEnd);
        stream.removeListener("close", onEnd);
    };
    stream.on("data", onData);
    stream.on("error", onError);
    stream.on("end", onEnd);
    stream.on("finish", onEnd);
    stream.on("close", onEnd);
    function getNext() {
        return new Promise(function (resolve, reject) {
            if (error)
                return reject(error);
            if (data.length)
                return resolve({ value: data.shift(), done: false });
            if (done)
                return resolve({ value: undefined, done: true });
            waiting.push([resolve, reject]);
        });
    }
    var iterator:any = {
        next: function () {
            return getNext();
        },
    };
    if (canUseAsyncIteratorSymbol) {
        iterator[Symbol.asyncIterator] = function () {
            return this;
        };
    }
    return iterator;
}

export function responseIterator(response: any) {
    var body = response;
    if (isNodeResponse(response))
        body = response.body;
    if (Buffer.isBuffer(response))
        body = Readable.from(response);
    if (isAsyncIterableIterator(body))
        return asyncIterator(body);
    if (isReadableStream(body))
        return readerIterator(body.getReader());
    if (isStreamableBlob(body))
        return readerIterator(body.stream().getReader());
    if (isBlob(body))
        return promiseIterator(body.arrayBuffer());
    if (isNodeReadableStream(body))
        return nodeStreamIterator(body);
    throw new Error("Unknown body type for responseIterator. Please pass a streamable response.");
}
