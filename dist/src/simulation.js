"use strict";
/* Copyright (c) 2021-23 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Board_1 = require("./Board");
/**
 * Example code for simulating a game.
 *
 * PS4 instructions: you may use, modify, or remove this file,
 *   completing it is recommended but not required.
 *
 * @throws Error if an error occurs reading or parsing the board
 */
async function simulationMain() {
    const filename = 'boards/perfect.txt';
    const board = await Board_1.Board.parseFromFile(filename);
    const size = 3;
    const players = 2;
    const tries = 10;
    const maxDelayMilliseconds = 100;
    // start up one or more players as concurrent asynchronous function calls
    const playerPromises = [];
    // for (let ii = 0; ii < players; ++ii) {
    //     playerPromises.push(player(ii));
    // }
    playerPromises.push(board.flip('1', 0, 0));
    playerPromises.push(board.flip('1', 0, 1));
    playerPromises.push(board.flip('1', 0, 2));
    playerPromises.push(board.flip('2', 0, 0));
    // wait for all the players to finish (unless one throws an exception)
    await Promise.all(playerPromises);
    console.log(board.look('2'));
    /** @param playerNumber player to simulate */
    async function player(playerNumber) {
        // TODO set up this player on the board if necessary
        const ID = `${playerNumber}`;
        // for (let jj = 0; jj < tries; ++jj) {
        //     console.log(`this is player ${ID}`);
        //     console.log(board.look(ID));
        //     await timeout(Math.random() * maxDelayMilliseconds);
        //     // TODO try to flip over a first card at (randomInt(size), randomInt(size))
        //     //      which might block until this player can control that card
        //     board.flip(ID, 1,1);
        //     await timeout(Math.random() * maxDelayMilliseconds);
        //     // TODO and if that succeeded,
        //     //      try to flip over a second card at (randomInt(size), randomInt(size))
        //     board.flip(ID, 1, 2);
        // }
    }
}
/**
 * Random positive integer generator
 *
 * @param max a positive integer which is the upper bound of the generated number
 * @returns a random integer >= 0 and < max
 */
function randomInt(max) {
    return Math.floor(Math.random() * max);
}
/**
 * @param milliseconds duration to wait
 * @returns a promise that fulfills no less than `milliseconds` after timeout() was called
 */
async function timeout(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
if (require.main === module) {
    void simulationMain();
}
//# sourceMappingURL=simulation.js.map