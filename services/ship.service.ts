import { GameBoard, ResponseTypes } from "../models/types";
import PlayerService, { Player } from "./player.service.ts";

export default class ShipService {
    readonly gameBoards: Map<number, GameBoard> = new Map<number, GameBoard>();

    constructor() {}

    addShips(gameBoard: GameBoard): void {
        this.gameBoards.set(gameBoard.indexPlayer, gameBoard);
    }

    checkStartGame(gameId: number): boolean {
        let count = 0;
        Array.from(this.gameBoards.values()).map((value) => {
            if (value.gameId === gameId) {
                count++;
            }
        });

        return count === 2;
    }

    startGame(gameId: number, playerService: PlayerService): void {
        const gamePlayers: GameBoard[] = [];

        Array.from(this.gameBoards.values()).map((value) => {
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

        player1.userWs.send(JSON.stringify(player1StartGameResponse));
        console.log(ResponseTypes.GAME_START, player1StartGameResponse);

        player2.userWs.send(JSON.stringify(player2StartGameResponse));
        console.log(ResponseTypes.GAME_START, player2StartGameResponse);
    }
}
