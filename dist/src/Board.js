"use strict";
/* Copyright (c) 2021-23 MIT 6.102/6.031 course staff, all rights reserved.
 * Redistribution of original or derived work requires permission of course staff.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Board = void 0;
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importDefault(require("fs"));
const Deferred_1 = require("./Deferred");
/**
 * TODO specification
 * Mutable and concurrency safe.
 */
class Board {
    // Abstraction function:
    //   AF[row, col, cards] = 
    //      1) creating a board with row x col dimension (start from the top left corner).
    //      2) the list cards (this.cards) also has row x col dimension where cards[i][j] is the text of the Card object at (i,j) coordinate of the board;
    //      3) listPlayers who is playing with this board
    //      4) originalCluster: the relationship among every cards on the board. Aka this is the set of positions of similars cards;
    //      5) watchers is the list of watchers who are watching and waiting for a change to get the Board state from their perspectives
    //      6) block: a map has key `${row}x${col}` to map a position to a deferred so that it can block the player
    // Representation invariant:
    //      1) Row and Col must be positive integers.
    //      2) faceUpUncontrolled element must be Player object or empty string ''
    //      3) inControl element must be Player object or empty string ''
    //      4) All matrices must have row x col size
    //      5) Cards has been removed must be in pairs
    // Safety from rep exposure:
    //   Row, col are readonly and immutable
    //   All fields are private and never returned
    //   The cards from constructor is string[][] and used to generate Card[][] to prevent mutations and aliasing
    constructor(row, col, cards) {
        this.watchers = new Map();
        this.block = new Map();
        this.cards = cards.map(array => array.map(text => new Card(text))); //copying the list of cards
        this.row = row;
        this.col = col;
        this.listPlayers = new Map();
        this.checkRep();
    }
    checkRep() {
        //check 1
        (0, assert_1.default)(Number.isInteger(this.row) && this.row > 0, "row of board must be a positive integer");
        (0, assert_1.default)(Number.isInteger(this.col) && this.col > 0, "col of board must be a positive integer");
        //check 2,3,4
        // const matrices = [this.faceUpUncontrolled, this.inControl, this.cards];
        // for (const matrix of matrices) {
        (0, assert_1.default)(this.cards.length === this.row, "expect the correct number of rows");
        for (const row of this.cards) {
            (0, assert_1.default)(row.length === this.col, "expect the correct number of columns");
        }
        // check 5
        const seenCard = new Set();
        for (const row of this.cards) {
            for (const card of row) {
                if (!card.onBoard && !seenCard.has(card.text)) {
                    seenCard.add(card.text);
                }
                else if (!card.onBoard && seenCard.has(card.text)) {
                    seenCard.delete(card.text);
                }
            }
        }
        assert_1.default.deepStrictEqual(seenCard, new Set(), `removed cards must be in a pair`);
    }
    /**
     * Add a player to the list of players playing on this board and return that player.
     * If the player is already in the list, simply return that player.
     * @params playerID, the string of that player's ID
     * @return, the player that has that ID.
     */
    addPlayer(playerID) {
        let player;
        if (this.listPlayers.has(playerID)) {
            player = this.listPlayers.get(playerID) ?? new Player('');
        }
        else {
            player = new Player(playerID);
            this.listPlayers.set(playerID, player);
        }
        return player;
    }
    /**
     * Check the 3rd rule before the player flip the first card again.
     * @param player, the player who is trying to make the flip
     * @returns, void removes the two cards if the player found a match; else, relinquish their possession and turn those cards facedown.
     */
    check3rdRule(player) {
        const controlledCards = player.inControl;
        // 3-A, found a match => removed the two cards
        if (controlledCards.size === 2) {
            for (const [n, m] of controlledCards) {
                (this.cards[n] ?? [])[m]?.remove();
                player.giveUpControl(false); //refresh their possession
                this.release(n, m);
            }
            this.notify();
        }
        const playerID = player.id;
        // 3-B, failed to find a match => had to relinquish their control => turn them face down before pick a new one
        const reliquishedCards = player.relinquished;
        if (reliquishedCards.size !== 0) {
            for (const [n, m] of reliquishedCards) {
                if ((this.cards[n] ?? [])[m]?.lastController === playerID) { //if the card they just relinquished is not being controlled by a new player
                    (this.cards[n] ?? [])[m]?.turnDown(true);
                    this.release(n, m);
                }
                player.giveUpControl(false); //refresh their possesion
            }
            this.notify();
        }
    }
    /**
     *
     * @param player
     * @param row
     * @param col
     */
    async flipFirst(player, row, col, targetCard) {
        // 1-A
        if (!targetCard.onBoard) {
            this.checkRep();
            new Deferred_1.Deferred().reject;
        }
        // 1-B
        else if (!targetCard.faceUp) {
            targetCard.faceUp = true;
            player.gainControl(row, col);
            targetCard.controlledBy(player.id);
            this.notify();
            this.checkRep();
        }
        // 1-C 
        else if (targetCard.controller === '') {
            player.gainControl(row, col);
            targetCard.controlledBy(player.id);
            this.checkRep();
            // 1-D
        }
        else {
            await this.untilCellAvailable(row, col);
            if (targetCard.onBoard) {
                player.gainControl(row, col);
                targetCard.controlledBy(player.id);
            }
            else {
                new Deferred_1.Deferred().reject;
                // throw new Error ("the card has been removed");
            }
            this.checkRep();
        }
        //     while (true) {
        //         const cellController = targetCard.controller;
        //         if (cellController) {
        //             // 1-D
        //             this.checkRep();
        //             await new Promise<void>((resolve) => this.block.get(`${row}x${col}`)?.push(resolve))
        //         } else
        //             break;
        //     }
        //     // 1-A
        //     if (!targetCard.onBoard) { 
        //         this.checkRep();
        //         new Deferred<void>().reject;
        //     }
        //     // 1-B
        //     else if (!targetCard.faceUp) {
        //         targetCard.faceUp = true; 
        //         player.gainControl(row, col);
        //         targetCard.controlledBy(player.id);
        //         this.notify();
        //         this.checkRep();
        // }
    }
    /**
     * Flip the second of a player who is currently owning 1 card.
     * @param player The player who is trying to make the second flip
     * @param row the row position, non-negative integer
     * @param col the col position, non-negative integer
     * @param controlledCards the set of position of the cards controlled by the player
     * @param targetCard the card that the player is trying to flip
     */
    async flipSecond(player, row, col, controlledCards, targetCard) {
        // Second card, player already controls 1 card  
        let posRow = -1;
        let posCol = -1;
        for (const [n, m] of controlledCards) {
            posRow = n;
            posCol = m;
        }
        const cardInControl = (this.cards[posRow] ?? [])[posCol] ?? new Card('');
        // 2-C+D+E, the card is uncontrolled and still on board
        if (!targetCard.controller && targetCard.onBoard) {
            if (!targetCard.faceUp) {
                targetCard.turnDown(false);
                this.notify();
            }
            // turn the card up, 2-C
            // 2-D, gain control first
            targetCard.controlledBy(player.id); // being controlled by the player
            player.gainControl(row, col); // the player gain his control
            // 2-E, don't find a match => relinquish both card
            if (targetCard.text !== cardInControl.text) {
                player.giveUpControl(true);
                this.release(row, col);
                this.release(posRow, posCol);
            }
            this.checkRep();
        }
        else { //2-A + 2-B
            player.giveUpControl(true);
            this.release(posRow, posCol);
            this.checkRep();
            new Deferred_1.Deferred().reject;
        }
    }
    /**
     * The player defined by the playerID try to flip the card at the position (row, col) on the board. This action would mutate the state of the board.
     * The result from this action follows the rules:
     *      1-A: If there is no card there (the player identified an empty space, perhaps because the card was just removed by another player), the operation does nothing.
     *      1-B: If the card is face down, it turns face up (all players can now see it) and the player controls that card.
     *      1-C: If the card is already face up, but not controlled by another player, then it remains face up, and the player controls the card.
     *      1-D: And if the card is face up and controlled by another player, the operation blocks. The player will contend with other players to take control of the card at the next opportunity.
     *
     *      2-A: If there is no card there, the operation fails. The player also relinquishes control of their first card (but it remains face up for now).
            2-B: If the card is face up and controlled by a player (another player or themselves), the operation fails. To avoid deadlocks, the operation does not block. The player also relinquishes control of their first card (but it remains face up for now).
                —If the card is face down, or if the card is face up but not controlled by a player, then:
                    2-C: If it is face down, it turns face up.
                    2-D: If the two cards are the same, that’s a successful match!
                            The player keeps control of both cards (and they remain face up on the board for now).
                    2-E: If they are not the same, the player relinquishes control of both cards (again, they remain face up for now).
     *      3-A: If they had turned over a matching pair, they control both cards.
                    Now, those cards are removed from the board, and they relinquish control of them. Score-keeping is not specified as part of the game.
            3-B: Otherwise, they had turned over one or two non-matching cards, and relinquished control but left them face up on the board.
                    Now, for each of those card(s), if the card is still on the board, currently face up, and currently not controlled by another player, the card is turned face down.
     * @param playerID: a non-empty string of alphanumeric or underscore characters
     * @param row positive integer
     * @param col positive
     */
    async flip(playerID, row, col) {
        this.checkRep();
        // Get the player
        const player = this.addPlayer(playerID);
        // Get the target Card
        const targetCard = (this.cards[row] ?? [])[col] ?? new Card('');
        // Before the Player flips his first card (check 3-A and 3-B)
        this.check3rdRule(player);
        // Get the player controlled Card after the check
        const controlledCards = player.inControl;
        // The Player flips his first card
        if (controlledCards.size === 0) {
            await this.flipFirst(player, row, col, targetCard);
        }
        else {
            await this.flipSecond(player, row, col, controlledCards, targetCard);
        }
    }
    /**
     * Given a position on the board, release the card at the position: update the controller of that card, make that card be available for any players who are blocked
     * @param row
     * @param col
     */
    release(row, col) {
        (this.cards[row] ?? [])[col]?.controlledBy('');
        if (this.block.has(`${row}x${col}`)) {
            const line = this.block.get(`${row}x${col}`) ?? [];
            line[0]?.resolve();
        }
    }
    /**
     * Notify every watchers who is watching this board by resolving the promises
     */
    notify() {
        for (const watcher of this.watchers.keys()) {
            this.watchers.get(watcher)?.resolve();
        }
    }
    /**
     * Given a position on the board, return a promise to notify when the card is available and block any player who wants to control that card
     * @param playerID, the ID of the player who is blocked at this card
     * @param row row of the board
     * @param col col of the board
     */
    async untilCellAvailable(row, col) {
        const deferred = new Deferred_1.Deferred();
        if (!this.block.has(`${row}x${col}`)) {
            this.block.set(`${row}x${col}`, []);
        }
        const block = this.block.get(`${row}x${col}`) ?? [];
        block.push(deferred);
        console.log(this.block);
        await deferred.promise;
    }
    /**
     * The Board_State from the perspective of a defined player. Available status for each cell:
     *      - `none` if a card has been removed
     *      - `down` if a card is facing down
     *      - `up ${card}` if a card is facing up but is controlled by a different player (or by no ones)
     *      - `my ${card}` if a card is facing up and is controlled by the player
     * @param playerID: a non-empty string of alphanumeric or underscore characters
     * @return string, follow the syntax as described in PS4
     *  BOARD_STATE ::= ROW "x" COLUMN NEWLINE (SPOT NEWLINE)+
     *  SPOT ::= "none" | "down" | "up " CARD | "my " CARD
        CARD ::= [^\s\n\r]+
        ROW ::= INT
        COLUMN ::= INT
        INT ::= [0-9]+
        NEWLINE ::= "\r"? "\n"
     */
    async look(playerID) {
        let result = `${this.row}x${this.col}\n`;
        for (let i = 0; i < this.row; ++i) {
            for (let j = 0; j < this.col; ++j) {
                if ((this.cards[i] ?? [])[j]?.onBoard === false)
                    result = result + 'none\n';
                else if ((this.cards[i] ?? [])[j]?.faceUp === false)
                    result = result + 'down\n';
                else
                    result = result + `${(this.cards[i] ?? [])[j]?.controller === playerID ? 'my' : 'up'} ${(this.cards[i] ?? [])[j]?.text}\n`;
            }
        }
        this.checkRep();
        return result;
    }
    /**
     * As specified in PS4
     * @param playerID a player who is changing the board, must satisfy the requirements of Player object
     * @param func a function to change the card, be specified in PS4
     * @returns a new state of the board from that player's perspective
     */
    async map(playerID, func) {
        const promises = new Array();
        for (const row of this.cards) {
            for (const card of row) {
                promises.push(card.change(func));
            }
        }
        await Promise.all(promises);
        this.notify();
        return this.look(playerID);
    }
    /**
     * As specified in PS4
     */
    async watch(playerID) {
        await this.untilChange(playerID);
        return this.look(playerID);
    }
    /**
     *
     * @param watcher
     */
    async untilChange(watcher) {
        const deferred = new Deferred_1.Deferred();
        this.watchers.set(`watcher`, deferred);
        await deferred.promise;
    }
    /**
     * @returns the dimension of the Board and the list of Players who are playing this board
     */
    toString() {
        let result = `Dimensions: ${this.row} x ${this.col}\n
                      List of players: \n`;
        for (const player of this.listPlayers.keys()) {
            result = result + `    -Player 1: ${player} \n`;
        }
        return result;
    }
    /**
     * Make a new board by parsing a file.
     *
     * PS4 instructions: the specification of this method may not be changed.
     *
     * @param filename path to game board file
     * @returns (a promise for) a new board with the size and cards from the file
     * @throws Error if the file cannot be read or is not a valid game board
     */
    static async parseFromFile(filename) {
        const file = await fs_1.default.promises.readFile(filename, { encoding: 'utf-8' });
        const lines = file.split(/\r?\n/);
        const dimension = lines[0]?.match(/^([0-9]+)x([0-9]+)$/); //reference here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions/Cheatsheet 
        //Check for errors
        if (dimension === null || dimension === undefined || dimension[1] === undefined || dimension[2] === undefined)
            throw new Error('Dimension has syntax errors');
        const row = Number.parseInt(dimension[1]);
        const col = Number.parseInt(dimension[2]);
        if (row <= 0 || col <= 0)
            throw new Error('Row and col must be positive integers');
        if (lines.length !== row * col + 2) //first line is dimension and the last card is followed by a newline character
            throw new Error('Number of lines is not correct');
        if (lines[row * col + 1] !== '')
            throw new Error('Must end with empty line');
        // Parse the file to create Board
        const cards = [];
        for (let i = 0; i < row; ++i) {
            cards.push([]);
            for (let j = 0; j < col; ++j) {
                const text = lines[1 + i * col + j] ?? '';
                if (text.search(/\s/) !== -1)
                    throw new Error('Invalid card');
                cards[i]?.push(text);
            }
        }
        return new Board(row, col, cards);
    }
}
exports.Board = Board;
class Player {
    // TODO constructor
    /**
     * Create an expression with the given ID
     *
     * @param id
     */
    constructor(id) {
        this.id = id;
        this.inControl = new Set();
        this.relinquished = new Set();
        this.checkRep();
    }
    // TODO checkRep
    checkRep() {
        // Check 1 + 2
        const validChars = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
            'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '_']);
        (0, assert_1.default)(this.id.length !== 0, "expected non-empty player's ID");
        for (const char of this.id) {
            (0, assert_1.default)(validChars.has(char), 'invalid character detected');
        }
        // Check 3
        (0, assert_1.default)(this.inControl.size === 0 || this.inControl.size === 1, "player can only control 0 or 1 card");
        (0, assert_1.default)(this.relinquished.size === 0 || this.relinquished.size === 1, "player can only have 0 or 1 card to relinquish");
    }
    // TODO other methods
    gainControl(row, col) {
        this.inControl.add([row, col]);
    }
    giveUpControl(relinquish) {
        this.relinquished = new Set();
        if (relinquish) {
            for (const position of this.inControl) {
                this.relinquished.add(position);
            }
        }
        this.inControl = new Set();
    }
    equalValue(that) {
        return (that instanceof Player && that.id === this.id);
    }
}
class Card {
    // Abstraction function:
    //  AF[text] = a card with a string text
    // Representation invariant: 
    //  text must be non-empty string of non-whitespace non-newline characters
    //Safety from rep exposure:
    //  only reveal the text of the card which is string
    // TODO constructor
    constructor(text) {
        this.text = text;
        this.text = text;
        this.onBoard = true; //this.onBoard === True iff the card is not removed yet
        this.faceUp = false;
        this.controller = '';
        this.lastController = '';
        this.checkRep();
    }
    // TODO checkRep
    checkRep() {
        (0, assert_1.default)(this.text.length !== 0, "Card must not be empty");
        (0, assert_1.default)(this.text.search(/[\s]/) === -1, "Card must not contain whitespace or newline characters");
    }
    // TODO other methods
    remove() {
        this.onBoard = false;
        this.controller = '';
        this.faceUp = false;
    }
    controlledBy(playerID) {
        this.lastController = this.controller;
        this.controller = playerID;
    }
    turnDown(down) {
        this.faceUp = !down;
    }
    async change(func) {
        this.text = await func(this.text);
    }
}
//# sourceMappingURL=Board.js.map