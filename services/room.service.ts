import PlayerService, { Player } from "./player.service";
import { ResponseTypes, updateRoomResponse } from "../models/types.ts";

export type Room = {
    indexRoom: number;
    players: Player[];
};

export default class RoomService {
    readonly rooms: Map<number, Room> = new Map<number, Room>();
    private static id: number = 0;

    constructor() {}

    updateRoomState(playerService: PlayerService): void {
        const updatedRoomList: updateRoomResponse[] = [];

        this.rooms.forEach((value: Room, key: number): void => {
            updatedRoomList.push({
                roomId: value.indexRoom,
                roomUsers: [
                    {
                        name: value.players[0].name,
                        index: value.players[0].id,
                    },
                ],
            });
        });

        playerService.players.forEach((value: Player, key: string) => {
            value.userWs.send(
                JSON.stringify({
                    type: ResponseTypes.ROOMS,
                    data: JSON.stringify(updatedRoomList),
                    id: 0,
                }),
            );
        });
    }

    createRoom(player: Player): void {
        const newRoom: Room = {
            players: [player],
            indexRoom: RoomService.id++,
        };

        this.rooms.set(newRoom.indexRoom, newRoom);
    }

    addPlayerToRoomAndCreateGame(player2: Player, indexRoom: number): void {
        const room: Room = <Room>this.rooms.get(indexRoom);
        this.rooms.delete(room.indexRoom);

        const player1: Player = room.players[0];

        const player1Res = {
            type: ResponseTypes.GAME_CREATE,
            data: {
                idGame: indexRoom,
                idPlayer: player1.id,
            },
            id: 0,
        };

        const player2Res = {
            type: ResponseTypes.GAME_CREATE,
            data: {
                idGame: indexRoom,
                idPlayer: player2.id,
            },
            id: 0,
        };

        console.log("ROOM: ", room);
        console.log("PLAYER1: ", player1Res);
        console.log("PLAYER2: ", player2Res);

        // Send game to player #1
        player1.userWs.send(JSON.stringify(player1Res));
        console.log(player1Res.type, player1Res);

        // Send game to player #2
        player2.userWs.send(JSON.stringify(player2Res));
        console.log(player2Res.type, player2Res);
    }
}
