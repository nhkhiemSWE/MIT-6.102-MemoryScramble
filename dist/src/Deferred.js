"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deferred = void 0;
const assert_1 = __importDefault(require("assert"));
/** Deferred represents a promise plus operations to resolve or reject it. */
class Deferred {
    /** Make a new Deferred. */
    constructor() {
        let resolve;
        let reject;
        this.promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        // TypeScript's static checking doesn't know for sure 
        // that the Promise constructor callback above is called synchronously,
        // so assert that resolve and reject have indeed been initialized by this point
        (0, assert_1.default)(resolve);
        (0, assert_1.default)(reject);
        this.resolve = resolve;
        this.reject = reject;
    }
}
exports.Deferred = Deferred;
//# sourceMappingURL=Deferred.js.map