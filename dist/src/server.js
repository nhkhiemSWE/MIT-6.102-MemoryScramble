"use strict";
/* Copyright (c) 2021-23 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebServer = void 0;
const assert_1 = __importDefault(require("assert"));
const process_1 = __importDefault(require("process"));
const express_1 = __importDefault(require("express"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const Board_1 = require("./Board");
const commands_1 = require("./commands");
/**
 * Start a game server using the given arguments.
 *
 * PS4 instructions: you are advised *not* to modify this file.
 *
 * Command-line usage:
 *     npm start PORT FILENAME
 * where:
 *
 *   - PORT is an integer that specifies the server's listening port number,
 *     0 specifies that a random unused port will be automatically chosen.
 *   - FILENAME is the path to a valid board file, which will be loaded as
 *     the starting game board.
 *
 * For example, to start a web server on a randomly-chosen port using the
 * board in `boards/hearts.txt`:
 *     npm start 0 boards/hearts.txt
 *
 * @throws Error if an error occurs parsing a file or starting a server
 */
async function main() {
    const [portString, filename] = process_1.default.argv.slice(2); // skip the first two arguments 
    // (argv[0] is node executable file, argv[1] is this script)
    if (portString === undefined) {
        throw new Error('missing PORT');
    }
    const port = parseInt(portString);
    if (isNaN(port) || port < 0) {
        throw new Error('invalid PORT');
    }
    if (filename === undefined) {
        throw new Error('missing FILENAME');
    }
    const board = await Board_1.Board.parseFromFile(filename);
    const server = new WebServer(board, port);
    await server.start();
}
/**
 * HTTP web game server.
 */
class WebServer {
    /**
     * Make a new web game server using board that listens for connections on port.
     *
     * @param board shared game board
     * @param requestedPort server port number
     */
    constructor(board, requestedPort) {
        this.board = board;
        this.requestedPort = requestedPort;
        this.app = (0, express_1.default)();
        this.app.use((request, response, next) => {
            // allow requests from web pages hosted anywhere
            response.set('Access-Control-Allow-Origin', '*');
            next();
        });
        /*
         * Handle a request for /look/<playerId>.
         */
        this.app.get('/look/:playerId', (0, express_async_handler_1.default)(async (request, response) => {
            const { playerId } = request.params;
            (0, assert_1.default)(playerId);
            const boardState = await (0, commands_1.look)(this.board, playerId);
            response
                .status(http_status_codes_1.default.OK) // 200
                .type('text')
                .send(boardState);
        }));
        /*
         * Handle a request for /flip/<playerId>/<row>,<column>.
         */
        this.app.get('/flip/:playerId/:location', (0, express_async_handler_1.default)(async (request, response) => {
            const { playerId, location } = request.params;
            (0, assert_1.default)(playerId);
            (0, assert_1.default)(location);
            const [row, column] = location.split(',').map(s => parseInt(s));
            (0, assert_1.default)(row !== undefined && !isNaN(row));
            (0, assert_1.default)(column !== undefined && !isNaN(column));
            const boardState = await (0, commands_1.flip)(this.board, playerId, row, column);
            response
                .status(http_status_codes_1.default.OK) // 200
                .type('text')
                .send(boardState);
        }));
        /*
         * Handle a request for /watch/<playerId>.
         */
        this.app.get('/watch/:playerId', (0, express_async_handler_1.default)(async (request, response) => {
            const { playerId } = request.params;
            (0, assert_1.default)(playerId);
            const boardState = await (0, commands_1.watch)(this.board, playerId);
            response
                .status(http_status_codes_1.default.OK) // 200
                .type('text')
                .send(boardState);
        }));
    }
    /**
     * Start this server.
     *
     * @returns (a promise that) resolves when the server is listening
     */
    start() {
        return new Promise(resolve => {
            this.server = this.app.listen(this.requestedPort, () => {
                console.log('server now listening at', this.port);
                resolve();
            });
        });
    }
    /**
     * @returns the actual port that server is listening at. (May be different
     *          than the requestedPort used in the constructor, since if
     *          requestedPort = 0 then an arbitrary available port is chosen.)
     *          Requires that start() has already been called and completed.
     */
    get port() {
        const address = this.server?.address() ?? 'not connected';
        if (typeof (address) === 'string') {
            throw new Error('server is not listening at a port');
        }
        return address.port;
    }
    /**
     * Stop this server. Once stopped, this server cannot be restarted.
     */
    stop() {
        this.server?.close();
        console.log('server stopped');
    }
}
exports.WebServer = WebServer;
if (require.main === module) {
    void main();
}
//# sourceMappingURL=server.js.map