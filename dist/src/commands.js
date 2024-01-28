"use strict";
/* Copyright (c) 2021-23 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.watch = exports.map = exports.flip = exports.look = void 0;
/**
 * String-based commands provided by the Memory Scramble game.
 *
 * PS4 instructions: these are required functions.
 * You MUST NOT change the names, type signatures, or specs of these functions.
 */
/**
 * Looks at the current state of the board.
 *
 * @param board a Memory Scramble board
 * @param playerId ID of player looking at the board;
 *                 must be a nonempty string of alphanumeric or underscore characters
 * @returns the state of the board, in the format described in the ps4 handout
 */
async function look(board, playerId) {
    return board.look(playerId);
    // implement with glue code only, at most three lines
}
exports.look = look;
/**
 * Tries to flip over a card on the board, following the rules in the ps4 handout.
 * If another player controls the card, then this operation blocks until the flip
 * either becomes possible or fails.
 *
 * @param board a Memory Scramble board
 * @param playerId ID of player making the flip;
 *                 must be a nonempty string of alphanumeric or underscore characters
 * @param row row number of card to flip;
 *            must be an integer in [0, height of board), indexed from the top of the board
 * @param column column number of card to flip;
 *               must be an integer in [0, width of board), indexed from the left of the board
 * @returns the state of the board after the flip, in the format described in the ps4 handout
 * @throws an error (rejecting the promise) if the flip operation fails as described
 *         in the ps4 handout.
 */
async function flip(board, playerId, row, column) {
    await board.flip(playerId, row, column);
    return board.look(playerId);
    // implement with glue code only, at most three lines
}
exports.flip = flip;
/**
 * Modifies board by replacing every card with f(card), without affecting other state of the game.
 *
 * This operation must be able to interleave with other operations (e.g. look() should not
 * block while a map() is in progress), but the board must remain observably consistent for
 * players: if two cards on the board match each other before map() is called, then it must not
 * be possible for any player to observe a board state in which that pair of cards do not match.
 *
 * f must be a pure function from cards to cards:
 * given some legal card `c`, f(c) should be a legal replacement card which is consistently
 * the same every time f(c) is called for that same `c`.
 *
 * @param board game board
 * @param playerId ID of player applying the map;
 *                 must be a nonempty string of alphanumeric or underscore characters
 * @param f pure function from cards to cards
 * @returns the state of the board after the replacement, in the format
 *          described in the ps4 handout
 */
async function map(board, playerId, f) {
    return board.map(playerId, f);
    // implement with glue code only, at most three lines
}
exports.map = map;
/**
 * Watches the board for a change, blocking until any cards turn face up or face down,
 * are removed from the board, or change from one string to a different string.
 *
 * @param board a Memory Scramble board
 * @param playerId ID of player watching the board;
 *                 must be a nonempty string of alphanumeric or underscore characters
 * @returns the state of the board, in the format described in the ps4 handout
 */
async function watch(board, playerId) {
    return board.watch(playerId);
    // implement with glue code only, at most three lines
}
exports.watch = watch;
//# sourceMappingURL=commands.js.map