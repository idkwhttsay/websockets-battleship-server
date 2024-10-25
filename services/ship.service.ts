import { WebSocket } from "ws";
import {
    AttackRequest,
    attackStatus,
    GameBoard,
    GameBoardRequest,
    ResponseTypes,
    Ship,
} from "../models/types";
import PlayerService, { Player } from "./player.service.ts";

const dx: number[] = [-1, 0, 0, 1];
const dy: number[] = [0, -1, 1, 0];

export default class ShipService {
    readonly gameBoards: Map<number, GameBoard> = new Map<number, GameBoard>();
    readonly opponent: Map<number, Player> = new Map<number, Player>();
    readonly cellRepresentationGameBoard: Map<number, GameBoardRequest> =
        new Map<number, GameBoardRequest>();

    constructor() {}

    private initialize2DArray(n: number): number[][] {
        return Array.from({ length: n }, () => Array(n).fill(0));
    }

    addShips(gameBoard: GameBoardRequest): void {
        const shipMatrix: number[][] = this.initialize2DArray(10);
        let countCells: number = 0;

        gameBoard.ships.map((value: Ship) => {
            countCells += value.length;
            if (value.direction) {
                for (
                    let j = value.position.y;
                    j < value.position.y + value.length;
                    ++j
                ) {
                    shipMatrix[j][value.position.x] = 1;
                }
            } else {
                for (
                    let i = value.position.x;
                    i < value.position.x + value.length;
                    ++i
                ) {
                    shipMatrix[value.position.y][i] = 1;
                }
            }
        });

        this.cellRepresentationGameBoard.set(gameBoard.indexPlayer, gameBoard);

        this.gameBoards.set(gameBoard.indexPlayer, {
            gameId: gameBoard.gameId,
            ships: shipMatrix,
            indexPlayer: gameBoard.indexPlayer,
            cellsLeft: countCells,
        });
    }

    checkStartGame(gameId: number): boolean {
        let count: number = 0;
        Array.from(this.gameBoards.values()).map((value: GameBoard) => {
            if (value.gameId === gameId) {
                count++;
            }
        });

        return count === 2;
    }

    startGame(gameId: number, playerService: PlayerService): void {
        const gamePlayers: GameBoardRequest[] = [];

        Array.from(this.cellRepresentationGameBoard.values()).map(
            (value: GameBoardRequest) => {
                if (value.gameId === gameId) {
                    gamePlayers.push(value);
                }
            },
        );

        const player1: Player = playerService.findPlayerById(
            gamePlayers[0].indexPlayer,
        );

        const player2: Player = playerService.findPlayerById(
            gamePlayers[1].indexPlayer,
        );

        const player1StartGameResponse = {
            type: ResponseTypes.GAME_START,
            data: JSON.stringify({
                ships: JSON.stringify(gamePlayers[0].ships),
                currentPlayerIndex: gamePlayers[0].indexPlayer,
            }),
            id: 0,
        };

        const player2StartGameResponse = {
            type: ResponseTypes.GAME_START,
            data: JSON.stringify({
                ships: JSON.stringify(gamePlayers[1].ships),
                currentPlayerIndex: gamePlayers[1].indexPlayer,
            }),
            id: 0,
        };

        this.opponent.set(player1.id, player2);
        this.opponent.set(player2.id, player1);

        player1.userWs.send(JSON.stringify(player1StartGameResponse));
        console.log(ResponseTypes.GAME_START, player1StartGameResponse);

        player2.userWs.send(JSON.stringify(player2StartGameResponse));
        console.log(ResponseTypes.GAME_START, player2StartGameResponse);

        this.sendTurn(player1, player2);
    }

    sendTurn(player1: Player, player2: Player): void {
        const player1TurnResponse = {
            type: ResponseTypes.GAME_TURN,
            data: JSON.stringify({
                currentPlayer: player1.id,
            }),
            id: 0,
        };

        const player2TurnResponse = {
            type: ResponseTypes.GAME_TURN,
            data: JSON.stringify({
                currentPlayer: player2.id,
            }),
            id: 0,
        };

        player1.userWs.send(JSON.stringify(player1TurnResponse));
        console.log(ResponseTypes.GAME_TURN, player1TurnResponse);

        player2.userWs.send(JSON.stringify(player2TurnResponse));
        console.log(ResponseTypes.GAME_TURN, player2TurnResponse);
    }

    attack(
        ws: WebSocket,
        attackInfo: AttackRequest,
        playerService: PlayerService,
    ): void {
        const attackingPlayer: Player = playerService.findPlayerById(
            attackInfo.indexPlayer,
        );

        const defendingPlayer: Player = <Player>(
            this.opponent.get(attackingPlayer.id)
        );

        const attackedGameBoard: GameBoard = <GameBoard>(
            this.gameBoards.get(defendingPlayer.id)
        );

        const attackedCell: number =
            attackedGameBoard.ships[attackInfo.y][attackInfo.x];

        // TODO: Attack feedback (should be sent after every shot, miss and after kill sent miss for all cells around ship too)

        // Attack statuses - 0: no action, empty cell, 1: there's a ship, 2: shot but miss, 3: shot on target, 4: destroyed

        if (attackedCell == 0) {
            const attackResponseAttacker = {
                type: ResponseTypes.GAME_ATTACK,
                data: JSON.stringify({
                    position: JSON.stringify({
                        x: attackInfo.x,
                        y: attackInfo.y,
                    }),
                    currentPlayer: attackingPlayer.id,
                    status: attackStatus.MISS,
                }),
            };

            const attackResponseDefender = {
                type: ResponseTypes.GAME_ATTACK,
                data: JSON.stringify({
                    position: JSON.stringify({
                        x: attackInfo.x,
                        y: attackInfo.y,
                    }),
                    currentPlayer: defendingPlayer.id,
                    status: attackStatus.MISS,
                }),
            };

            attackedGameBoard.ships[attackInfo.y][attackInfo.x] = 2;
            this.gameBoards.set(defendingPlayer.id, attackedGameBoard);

            attackingPlayer.userWs.send(JSON.stringify(attackResponseAttacker));
            console.log(ResponseTypes.GAME_ATTACK, attackResponseAttacker);

            defendingPlayer.userWs.send(JSON.stringify(attackResponseDefender));
            console.log(ResponseTypes.GAME_ATTACK, attackResponseDefender);
        } else if (attackedCell == 1) {
            attackedGameBoard.cellsLeft--;
            attackedGameBoard.ships[attackInfo.y][attackInfo.x] = 3;

            if (
                this.checkIfDestroyed(
                    attackInfo.y,
                    attackInfo.x,
                    attackedGameBoard.ships,
                )
            ) {
                this.sendDestroyed(
                    attackInfo.y,
                    attackInfo.x,
                    attackedGameBoard.ships,
                    attackingPlayer,
                    defendingPlayer,
                );
            } else {
                this.gameBoards.set(defendingPlayer.id, attackedGameBoard);

                const attackResponseAttacker = {
                    type: ResponseTypes.GAME_ATTACK,
                    data: JSON.stringify({
                        position: JSON.stringify({
                            x: attackInfo.x,
                            y: attackInfo.y,
                        }),
                        currentPlayer: attackingPlayer.id,
                        status: attackStatus.SHOT,
                    }),
                };

                const attackResponseDefender = {
                    type: ResponseTypes.GAME_ATTACK,
                    data: JSON.stringify({
                        position: JSON.stringify({
                            x: attackInfo.x,
                            y: attackInfo.y,
                        }),
                        currentPlayer: attackingPlayer.id,
                        status: attackStatus.SHOT,
                    }),
                };

                attackingPlayer.userWs.send(
                    JSON.stringify(attackResponseAttacker),
                );
                defendingPlayer.userWs.send(
                    JSON.stringify(attackResponseDefender),
                );
            }
        }
    }

    checkIfDestroyed(y: number, x: number, shipBoard: number[][]): boolean {
        let result: boolean = shipBoard[y][x] === 3;

        for (let i = 0; i < 4; ++i) {
            const to_x: number = x + dx[i];
            const to_y: number = y + dy[i];

            if (
                to_x < 0 ||
                to_x > 9 ||
                to_y < 0 ||
                to_y > 9 ||
                shipBoard[to_y][to_x] == 0 ||
                shipBoard[to_y][to_x] == 2
            )
                continue;

            result = result && this.checkIfDestroyed(to_y, to_x, shipBoard);
        }

        return result;
    }

    sendDestroyed(
        y: number,
        x: number,
        shipBoard: number[][],
        attackingPlayer: Player,
        defendingPlayer: Player,
    ): void {}
}
