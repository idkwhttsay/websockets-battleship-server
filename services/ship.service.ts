import { WebSocket } from "ws";
import {
    AttackRequest,
    GameBoard,
    GameBoardRequest,
    ResponseTypes,
    Ship,
} from "../models/types";
import PlayerService, { Player } from "./player.service.ts";

// statuses:
// 0: no action, empty cell
// 1: there's a ship
// 2: shot but miss
// 3: shot on target
// 4: destroyed

export default class ShipService {
    readonly gameBoards: Map<number, GameBoard> = new Map<number, GameBoard>();
    readonly opponent: Map<number, Player> = new Map<number, Player>();

    constructor() {}

    initialize2DArray(n: number): number[][] {
        return Array.from({ length: n }, () => Array(n).fill(0));
    }

    addShips(gameBoard: GameBoardRequest): void {
        const shipMatrix: number[][] = this.initialize2DArray(10);
        let countCells: number = 0;

        gameBoard.ships.map((value: Ship) => {
            countCells += value.length;
            if (value.direction) {
                for (
                    let j = value.position.y, curLen = 0;
                    curLen < value.length;
                    --j, ++curLen
                ) {
                    shipMatrix[value.position.x][j] = 1;
                }
            } else {
                for (
                    let i = value.position.x;
                    i < value.position.x + value.length;
                    ++i
                ) {
                    shipMatrix[i][value.position.y] = 1;
                }
            }
        });

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
        const gamePlayers: GameBoard[] = [];

        Array.from(this.gameBoards.values()).map((value: GameBoard) => {
            if (value.gameId === gameId) {
                gamePlayers.push(value);
            }
        });

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

    sendTurn(player1: Player, player2: Player) {
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

        const attackedCell =
            attackedGameBoard.ships[attackInfo.x][attackInfo.y];

        // TODO: Attack feedback (should be sent after every shot, miss and after kill sent miss for all cells around ship too)
        if (attackedCell == 0) {
        }
    }
}
