import { WebSocket } from "ws";
import { RequestTypes, Response, ResponseTypes, Player } from "../models/types";
import PlayerService from "../services/player.service";
import RoomService from "../services/room.service";
import GameService from "../services/game.service";

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

        const currentPlayer: Player | undefined =
            this.playerService.findPlayerByWs(ws);

        this.roomService.updateRoomState(this.playerService);

        ws.on("close", () => {
            this.roomService.deleteRoomWithPlayer(ws, this.playerService);
            this.playerService.deletePlayer(ws);
        });

        if (currentPlayer) {
            if (type === RequestTypes.ROOM_CREATE) {
                if (
                    this.roomService.checkPlayerInRoom(currentPlayer) ===
                    undefined
                ) {
                    this.roomService.createRoom(currentPlayer);
                }

                this.roomService.updateRoomState(this.playerService);
            } else if (type === RequestTypes.ROOM_PLAYER) {
                if (
                    this.roomService.checkIfUserNotInRoom(
                        data.indexRoom,
                        currentPlayer,
                    )
                ) {
                    this.roomService.addPlayerToRoomAndCreateGame(
                        currentPlayer,
                        data.indexRoom,
                    );
                }

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
            } else if (type === RequestTypes.GAME_SINGLE) {
                // TODO: implement bot to play with
            }
        } else {
            return;
        }
    }
}
