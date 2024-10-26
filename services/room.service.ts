import PlayerService from "./player.service";
import { ResponseTypes, updateRoomResponse, Player } from "../models/types";
import { WebSocket } from "ws";

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
            if (value.id >= 0) {
                value.userWs.send(
                    JSON.stringify({
                        type: ResponseTypes.ROOMS,
                        data: JSON.stringify(updatedRoomList),
                        id: 0,
                    }),
                );
            }
        });
    }

    checkPlayerInRoom(player: Player) {
        return Array.from(this.rooms.values()).find(
            (value) => value.players[0] === player,
        );
    }

    checkIfUserNotInRoom(indexRoom: number, player: Player): boolean {
        const room = <Room>this.rooms.get(indexRoom);
        return room.players[0] !== player;
    }

    deleteRoomWithPlayer(ws: WebSocket, playerService: PlayerService): void {
        const player: Player = playerService.findPlayerByWs(ws);

        const roomIndecies: number[] = [];

        Array.from(this.rooms.values()).map((value: Room) => {
            if (value.players[0] === player) {
                roomIndecies.push(value.indexRoom);
            }
        });

        roomIndecies.map((value: number) => {
            this.rooms.delete(value);
        });

        this.updateRoomState(playerService);
    }

    createRoom(player: Player): number {
        const newRoom: Room = {
            players: [player],
            indexRoom: RoomService.id++,
        };

        this.rooms.set(newRoom.indexRoom, newRoom);
        return newRoom.indexRoom;
    }

    addPlayerToRoomAndCreateGame(player2: Player, indexRoom: number): void {
        const room: Room = <Room>this.rooms.get(indexRoom);
        this.rooms.delete(room.indexRoom);

        const player1: Player = room.players[0];

        const player1Res = {
            type: ResponseTypes.GAME_CREATE,
            data: JSON.stringify({
                idGame: room.indexRoom,
                idPlayer: player1.id,
            }),
            id: 0,
        };

        const player2Res = {
            type: ResponseTypes.GAME_CREATE,
            data: JSON.stringify({
                idGame: room.indexRoom,
                idPlayer: player2.id,
            }),
            id: 0,
        };

        // Send game to player #1
        player1.userWs.send(JSON.stringify(player1Res));
        console.log(player1Res.type, player1Res);

        // Send game to player #2
        if (player2.id >= 0) {
            player2.userWs.send(JSON.stringify(player2Res));
            console.log(player2Res.type, player2Res);
        }
    }
}
