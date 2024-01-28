/* Copyright (c) 2021-23 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */

import assert from 'assert';
import process from 'process';
import { Server } from 'http';
import express, { Application } from 'express';
import asyncHandler from 'express-async-handler';
import HttpStatus from 'http-status-codes';
import { Board } from './Board';
import { look, flip, map, watch } from './commands';

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
async function main(): Promise<void> {
    const [portString, filename] 
        = process.argv.slice(2); // skip the first two arguments 
                                 // (argv[0] is node executable file, argv[1] is this script)
    if (portString === undefined) { throw new Error('missing PORT'); }
    const port = parseInt(portString);
    if (isNaN(port) || port < 0) { throw new Error('invalid PORT'); }
    if (filename === undefined) { throw new Error('missing FILENAME'); }
    
    const board = await Board.parseFromFile(filename);
    const server = new WebServer(board, port);
    await server.start();
}


/**
 * HTTP web game server.
 */
export class WebServer {

    private readonly app: Application;
    private server: Server|undefined;

    /**
     * Make a new web game server using board that listens for connections on port.
     * 
     * @param board shared game board
     * @param requestedPort server port number
     */
    public constructor(
        private readonly board: Board, 
        private readonly requestedPort: number
    ) {
        this.app = express();
        this.app.use((request, response, next) => {
            // allow requests from web pages hosted anywhere
            response.set('Access-Control-Allow-Origin', '*');
            next();
        });

        /*
         * Handle a request for /look/<playerId>.
         */
        this.app.get('/look/:playerId', asyncHandler(async(request, response) => {
            const { playerId } = request.params;
            assert(playerId);

            const boardState = await look(this.board, playerId);
            response
            .status(HttpStatus.OK) // 200
            .type('text')
            .send(boardState);
        }));

        /*
         * Handle a request for /flip/<playerId>/<row>,<column>.
         */
        this.app.get('/flip/:playerId/:location', asyncHandler(async(request, response) => {
            const { playerId, location } = request.params;
            assert(playerId);
            assert(location);

            const [ row, column ] = location.split(',').map( s => parseInt(s) );
            assert(row !== undefined && !isNaN(row));
            assert(column !== undefined && !isNaN(column));

            const boardState = await flip(this.board, playerId, row, column);
            response
            .status(HttpStatus.OK) // 200
            .type('text')
            .send(boardState);
        }));

        /*
         * Handle a request for /watch/<playerId>.
         */
        this.app.get('/watch/:playerId', asyncHandler(async(request, response) => {
            const { playerId } = request.params;
            assert(playerId);

            const boardState = await watch(this.board, playerId);
            response
            .status(HttpStatus.OK) // 200
            .type('text')
            .send(boardState);
        }));
    }

    /**
     * Start this server.
     * 
     * @returns (a promise that) resolves when the server is listening
     */
    public start(): Promise<void> {
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
    public get port(): number {
        const address = this.server?.address() ?? 'not connected';
        if (typeof(address) === 'string') {
            throw new Error('server is not listening at a port');
        }
        return address.port;
    }

    /**
     * Stop this server. Once stopped, this server cannot be restarted.
     */
     public stop(): void {
        this.server?.close();
        console.log('server stopped');
    }
}


if (require.main === module) {
    void main();
}
