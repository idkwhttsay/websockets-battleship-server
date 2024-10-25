import { WebSocket } from "ws";
import { RequestTypes, Response, ResponseTypes } from "../models/types.ts";
import PlayerService, { Player } from "../services/player.service.ts";
import RoomService from "../services/room.service.ts";
import GameService from "../services/game.service.ts";

export default class App {
    private playerService: PlayerService = new PlayerService();
    private roomService: RoomService = new RoomService();
    private gameService: GameService = new GameService();

    constructor() {}

    handleMessage(ws: WebSocket, message: string): void {
        let { type, data } = JSON.parse(message);
        data = data ? JSON.parse(data) : {};

        if (type === RequestTypes.REG) {
            const res = this.playerService.loginOrRegister(
                data.name,
                data.password,
                ws,
            );

            const regWsResponse = {
                type: ResponseTypes.REG,
                data: JSON.stringify(res),
                id: 0,
            } as Response;

            ws.send(JSON.stringify(regWsResponse));
            console.log(ResponseTypes.REG, regWsResponse);

            this.playerService.updateWinners();
        }

        // TODO: updateRoomState when new user registers

        // TODO: delete user from everywhere when he leaves

        const currentPlayer: Player | undefined =
            this.playerService.findPlayerByWs(ws);

        if (currentPlayer) {
            if (type === RequestTypes.ROOM_CREATE) {
                this.roomService.createRoom(currentPlayer);
                this.roomService.updateRoomState(this.playerService);
            } else if (type === RequestTypes.ROOM_PLAYER) {
                this.roomService.addPlayerToRoomAndCreateGame(
                    currentPlayer,
                    data.indexRoom,
                );

                this.roomService.updateRoomState(this.playerService);
            } else if (type === RequestTypes.GAME_SHIPS) {
                this.gameService.addShips(data);
                if (this.gameService.checkStartGame(data.gameId)) {
                    this.gameService.startGame(data.gameId, this.playerService);
                }
            } else if (type === RequestTypes.GAME_ATTACK) {
                this.gameService.attack(ws, data, this.playerService);
            } else if (type === RequestTypes.GAME_RANDOM_ATTACK) {
                const randX: number = Math.floor(Math.random() * 10);
                const randY: number = Math.floor(Math.random() * 10);

                const randomAttackData = {
                    gameId: data.gameId,
                    x: randX,
                    y: randY,
                    indexPlayer: data.indexPlayer,
                };

                this.gameService.attack(
                    ws,
                    randomAttackData,
                    this.playerService,
                );
            }
        } else {
            return;
        }
    }
}
