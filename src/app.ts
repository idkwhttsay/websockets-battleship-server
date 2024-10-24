import { WebSocket } from "ws";
import { RequestTypes, Response, ResponseTypes } from "../models/types.ts";
import PlayerService from "../services/player.service.ts";

export default class App {
    private playerService = new PlayerService();
    constructor() {}

    handleMessage(ws: WebSocket, message: string) {
        let { type, data } = JSON.parse(message);
        data = JSON.parse(data);

        if (type === RequestTypes.REG) {
            const res = this.playerService.loginOrRegister(
                data.name,
                data.password,
            );

            const regWsResponse = {
                type: ResponseTypes.REG,
                data: JSON.stringify(res),
                id: 0,
            } as Response;

            const updateWinnersWsResponse = {
                type: ResponseTypes.WINNERS,
                data: JSON.stringify(this.playerService.updateWinners()),
                id: 0,
            } as Response;

            ws.send(JSON.stringify(regWsResponse));
            ws.send(JSON.stringify(updateWinnersWsResponse));

            console.log(ResponseTypes.REG, regWsResponse);
            console.log(ResponseTypes.WINNERS, updateWinnersWsResponse);
        }
    }
}
