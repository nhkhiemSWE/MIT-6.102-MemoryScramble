"use strict";
/* Copyright (c) 2021-23 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const Board_1 = require("../src/Board");
/**
 * Tests for the Board abstract data type.
 */
describe('Board', function () {
    // Testing strategy:
    // Partition on the size of the board: 1x1, n x n (n > 1), n x m (where n !== m and n, m >1)
    // Partition on Rules : 1-A, 1-B, 1-C, 1-D, 2-A, 2-B, 2-C, 2-D, 2-E, 3-A, 3-B.
    // Partition on Parser
    // Partition on Look :
    //      Number of players: 0, 1, >1
    //      Number of cards facing down: 0, 1, >1 
    //      Number of cards facing up  : 0, 1, >1
    //      Number of controlled cards facing up : 0, 1
    //      Number of removed cards: 0, 1, >1
    // Partition on Flip : 
    //      Player who is flipping: controlling 0 card (no previous move), controlling 0 card (previously relinquished cards),
    //                              controlling 1 card and flip does not match, controlling 1 card and flip a match,
    //                              being blocked, not being blocked.
    //      The card that is being flipped: face-down, face-up (free), face-up controlled by another, removed.  
    // Partition on Watch:
    //      Event: turn up, turn down, remove, map 
    //      number of people is watching: 0, 1, >1
    // Partition on Map : Rep Invariants of Board ensure that map is working properly => no need test cases 
    //      
    it('constructor, row = col = 1', function () {
        const board = new Board_1.Board(1, 1, [['1']]);
        (0, assert_1.default)(board.row === 1 && board.col === 1, 'expected the correct board dimensions');
    });
    it('constructor, row = col > 1', function () {
        const board = new Board_1.Board(3, 3, [['1', '2', '3'], ['1', '2', '3'], ['1', '2', '3']]);
        (0, assert_1.default)(board.row === 3 && board.col === 3, 'expected the correct board dimensions');
    });
    it('constructor, row !== col > 1', function () {
        const board = new Board_1.Board(2, 3, [['1', '2', '3'], ['1', '2', '3']]);
        (0, assert_1.default)(board.row === 2 && board.col === 3, 'expected the correct board dimensions');
    });
    it('flip, rule 1-B, controlling 0 card (no previous move), card is facing down', async function () {
        const board = new Board_1.Board(1, 3, [['1', '2', '3']]);
        board.flip('Khiem', 0, 0);
        const boardState = await board.look('Khiem');
        assert_1.default.deepStrictEqual(boardState, '1x3\nmy 1\ndown\ndown\n', 'expected the correct board state');
    });
    it('flip, rule 1-A, card is removed', async function () {
        const board = new Board_1.Board(1, 3, [['1', '1', '2']]);
        board.flip('Khiem', 0, 0);
        board.flip('Khiem', 0, 1);
        board.flip('Khiem', 0, 2);
        assert_1.default.rejects(async () => board.flip('Linh', 0, 0), "expect an error for flipping removed card");
    });
    it('flip, rule 1-C, card is face-up (free)', async function () {
        const board = new Board_1.Board(1, 3, [['1', '1', '2']]);
        board.flip('Khiem', 0, 0);
        board.flip('Khiem', 0, 2);
        board.flip('Linh', 0, 0);
        const boardState = await board.look('Linh');
        assert_1.default.deepStrictEqual(boardState, '1x3\nmy 1\ndown\nup 2\n', 'expected the correct board state');
    });
    it('flip, rule 1-D, card is controlled by another player, player being blocked', async function () {
        const board = new Board_1.Board(1, 3, [['1', '1', '2']]);
        board.flip('Khiem', 0, 0);
        board.flip('Linh', 0, 0);
        const boardState = await board.look('Linh');
        assert_1.default.deepStrictEqual(boardState, '1x3\nup 1\ndown\ndown\n', 'expected the correct board state');
    });
    it('flip, rule 2-A + rule 3-A', async function () {
        const board = new Board_1.Board(1, 4, [['1', '1', '2', '3']]);
        board.flip('Khiem', 0, 0);
        board.flip('Khiem', 0, 1);
        const boardState = await board.look('Khiem');
        assert_1.default.deepStrictEqual(boardState, '1x4\nmy 1\nmy 1\ndown\ndown\n', 'expected the correct board state');
        board.flip('Khiem', 0, 2);
        board.flip('Linh', 0, 3);
        assert_1.default.rejects(async () => board.flip('Linh', 0, 1), "expect an error when flipping a removed card");
    });
    it('flip, rule 2-B, player relinquishes their first card because picking up a controlled card', async function () {
        const board = new Board_1.Board(1, 3, [['1', '1', '2']]);
        board.flip('Khiem', 0, 0);
        board.flip('Linh', 0, 2);
        assert_1.default.rejects(async () => board.flip('Linh', 0, 0), "expect an error when flipping a controlled card as your second card");
        const boardState = await board.look('Linh');
        assert_1.default.deepStrictEqual(boardState, '1x3\nup 1\ndown\nup 2\n', 'expected the correct board state');
    });
    it('flip, rule 2-C, player flips the facing down card and it does not a match', async function () {
        const board = new Board_1.Board(1, 3, [['1', '1', '2']]);
        board.flip('Khiem', 0, 0);
        board.flip('Khiem', 0, 2);
        const boardState = await board.look('Khiem');
        assert_1.default.deepStrictEqual(boardState, '1x3\nup 1\ndown\nup 2\n', 'expected the correct board state');
    });
    it('flip, rule 2-D, player flips the second card and it is a match', async function () {
        const board = new Board_1.Board(1, 4, [['1', '1', '2', '2']]);
        board.flip('Khiem', 0, 0);
        board.flip('Khiem', 0, 1);
        let boardState = await board.look('Khiem');
        assert_1.default.deepStrictEqual(boardState, '1x4\nmy 1\nmy 1\ndown\ndown\n', 'expected the correct board state');
        board.flip('Khiem', 0, 2);
        boardState = await board.look('Khiem');
        assert_1.default.deepStrictEqual(boardState, '1x4\nnone\nnone\nmy 2\ndown\n', 'expected the correct board state');
    });
    it('flip, rule 2-E + rule 3-B, player flips a facing up card and it does not match', async function () {
        const board = new Board_1.Board(1, 4, [['1', '1', '2', '2']]);
        board.flip('Khiem', 0, 0);
        board.flip('Khiem', 0, 2);
        board.flip('Linh', 0, 1);
        board.flip('Linh', 0, 2);
        let boardState = await board.look('Khiem');
        assert_1.default.deepStrictEqual(boardState, '1x4\nup 1\nup 1\nup 2\ndown\n', 'expected the correct board state');
        board.flip('Khiem', 0, 3);
        boardState = await board.look('Khiem');
        assert_1.default.deepStrictEqual(boardState, '1x4\ndown\nup 1\nup 2\nmy 2\n', 'expected the correct board state');
    });
    it('flip,1 player being blocked because the card is controlled by another', async function () {
        const board = new Board_1.Board(2, 2, [['1', '2'], ['1', '2']]);
        await board.flip('Khiem', 0, 0);
        let isResolved = false;
        const promise = board.flip('Linh', 0, 0).then(() => {
            isResolved = true;
        }, undefined);
        (0, assert_1.default)(!isResolved, 'expected blocking operation');
        await board.flip('Khiem', 0, 1);
        await promise;
        const boardState = await board.look('Linh');
        assert_1.default.deepStrictEqual(boardState, '2x2\nmy 1\nup 2\ndown\ndown\n');
    });
    it('watch, 1 person watching, return when card turns up', async function () {
        const board = new Board_1.Board(1, 3, [['1', '1', '2']]);
        // Blocking
        let isResolved = false;
        const promise = board.watch('Linh').then(() => {
            isResolved = true;
        }, undefined);
        (0, assert_1.default)(!isResolved, 'expected blocking operation');
        // Returning
        const output = board.watch('Linh');
        await board.flip('Khiem', 0, 0);
        (0, assert_1.default)(await output === '1x3\nup 1\ndown\ndown\n');
    });
    it('watch, 1 person watching, return when card turns down', async function () {
        const board = new Board_1.Board(1, 3, [['1', '1', '2']]);
        // Blocking
        let isResolved = false;
        await board.flip('Khiem', 0, 0);
        await board.flip('Khiem', 0, 2);
        const promise = board.watch('Linh').then(() => {
            isResolved = true;
        }, undefined);
        (0, assert_1.default)(!isResolved, 'expected blocking operation');
        const output = board.watch('Linh');
        await board.flip('Linh', 0, 0);
        (0, assert_1.default)(!isResolved, 'expected blocking operation');
        // Returning
        await board.flip('Khiem', 0, 1);
        assert_1.default.deepStrictEqual(await output, '1x3\nmy 1\nup 1\ndown\n', "must be correct state");
    });
    it('watch, 2 person watching, return when card is removed', async function () {
        const board = new Board_1.Board(1, 3, [['1', '1', '2']]);
        // Blocking
        let isResolved = false;
        await board.flip('Khiem', 0, 0);
        await board.flip('Khiem', 0, 1);
        const promise = board.watch('Linh').then(() => {
            isResolved = true;
        }, undefined);
        (0, assert_1.default)(!isResolved, 'expected blocking operation');
        // Returning
        const output = board.watch('Linh');
        await board.flip('Khiem', 0, 2);
        assert_1.default.deepStrictEqual(await output, '1x3\nnone\nnone\nup 2\n', "wrong state");
    });
    it('watch, 2 person watching, return when card changes but all down', async function () {
        const board = new Board_1.Board(1, 3, [['1', '1', '2']]);
        // Blocking
        let isResolved1 = false;
        const promise1 = board.watch('Linh').then(() => {
            isResolved1 = true;
        }, undefined);
        (0, assert_1.default)(!isResolved1, 'expected blocking operation');
        let isResolved2 = false;
        const promise2 = board.watch('Khiem').then(() => {
            isResolved2 = true;
        }, undefined);
        (0, assert_1.default)(!isResolved2, 'expected blocking operation');
        // Returning
        const output = board.watch('Linh');
        board.map('Linh', async (s) => (s + '2'));
        assert_1.default.deepStrictEqual(await output, '1x3\ndown\ndown\ndown\n', "wrong state");
    });
    it('watch, 2 person watching, return when card changes and some are up', async function () {
        const board = new Board_1.Board(1, 3, [['1', '1', '2']]);
        await board.flip('A', 0, 1);
        // Blocking
        let isResolved1 = false;
        const promise1 = board.watch('Linh').then(() => {
            isResolved1 = true;
        }, undefined);
        (0, assert_1.default)(!isResolved1, 'expected blocking operation');
        let isResolved2 = false;
        const promise2 = board.watch('Khiem').then(() => {
            isResolved2 = true;
        }, undefined);
        (0, assert_1.default)(!isResolved2, 'expected blocking operation');
        // Returning
        const output = board.watch('Linh');
        board.map('Linh', async (s) => (s + '2'));
        assert_1.default.deepStrictEqual(await output, '1x3\ndown\nup 12\ndown\n', "wrong state");
    });
    it('watch, 2 person watching, return when card changes and some are up', async function () {
        const filename = 'boards/perfect.txt';
        const board = await Board_1.Board.parseFromFile(filename);
    });
});
/**
 * Example test case that uses async/await to test an asynchronous function.
 * Feel free to delete these example tests.
 */
describe('async test cases', function () {
    it('reads a file asynchronously', async function () {
        const fileContents = (await fs_1.default.promises.readFile('boards/ab.txt')).toString();
        (0, assert_1.default)(fileContents.startsWith('5x5'));
    });
});
//# sourceMappingURL=BoardTest.js.map