import { WebSocket } from "ws";
import { Response, ResponseTypes } from "../models/types.ts";

export type Player = {
    name: string;
    password: string;
    id: number;
    wins: number;
    userWs: WebSocket;
};

export default class PlayerService {
    readonly players: Map<string, Player> = new Map<string, Player>();
    readonly playersByID: Map<number, Player> = new Map<number, Player>();

    private static id: number = 0;

    constructor() {}

    findPlayerByWs(ws: WebSocket) {
        return Array.from(this.players.values()).find(
            (player: Player) => player.userWs === ws,
        );
    }

    findPlayerById(playerId: number): Player {
        return <Player>this.playersByID.get(playerId);
    }

    loginOrRegister(name: string, password: string, ws: WebSocket) {
        if (this.players.has(name)) {
            const dbPlayer: Player = <Player>this.players.get(name);
            if (dbPlayer.password === password) {
                return {
                    name: name,
                    index: dbPlayer.id,
                    error: false,
                    errorText: null,
                };
            } else {
                return {
                    name: null,
                    index: null,
                    error: true,
                    errorText: "Incorrect password.",
                };
            }
        } else {
            const newPlayer = {
                name: name,
                password: password,
                id: PlayerService.id++,
                wins: 0,
                userWs: ws,
            };

            this.players.set(newPlayer.name, newPlayer);
            this.playersByID.set(newPlayer.id, newPlayer);

            return {
                name: newPlayer.name,
                index: newPlayer.id,
                error: false,
                errorText: null,
            };
        }
    }

    updateWinners() {
        let winnersArr: { name: string; wins: number }[] = [];

        this.players.forEach((value, key) => {
            winnersArr.push({
                name: value.name,
                wins: value.wins,
            });
        });

        winnersArr = winnersArr.sort((a, b) => b.wins - a.wins);

        const updateWinnersWsResponse = {
            type: ResponseTypes.WINNERS,
            data: JSON.stringify(winnersArr),
            id: 0,
        } as Response;

        console.log(ResponseTypes.WINNERS, updateWinnersWsResponse);

        this.players.forEach((value, key) => {
            value.userWs.send(JSON.stringify(updateWinnersWsResponse));
        });
    }
}
