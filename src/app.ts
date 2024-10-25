import { WebSocket } from "ws";
import { RequestTypes, Response, ResponseTypes } from "../models/types.ts";
import PlayerService, { Player } from "../services/player.service.ts";
import RoomService from "../services/room.service.ts";

export default class App {
    private playerService: PlayerService = new PlayerService();
    private roomService: RoomService = new RoomService();
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
            }
        } else {
            return;
        }
    }
}