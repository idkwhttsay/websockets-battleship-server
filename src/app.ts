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

            console.log(RequestTypes.REG, res);

            ws.send(
                JSON.stringify({
                    type: ResponseTypes.REG,
                    data: JSON.stringify(res),
                    id: 0,
                } as Response),
            );
        }
    }
}
