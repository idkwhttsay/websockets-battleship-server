import { WebSocket } from "ws";
import { RequestTypes, Response, ResponseTypes, Player } from "../models/types";
import PlayerService from "../services/player.service";
import RoomService from "../services/room.service";
import GameService from "../services/game.service";
import BotService from "../services/bot.service";

export default class App {
    private playerService: PlayerService = new PlayerService();
    private roomService: RoomService = new RoomService();
    private gameService: GameService = new GameService();
    private botService: BotService = new BotService();

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
            this.playerService.updateWinners();
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
                this.gameService.attack(ws, data, this.playerService, false);
            } else if (type === RequestTypes.GAME_RANDOM_ATTACK) {
                const randomAttackData = {
                    gameId: data.gameId,
                    x: -1,
                    y: -1,
                    indexPlayer: data.indexPlayer,
                };

                this.gameService.attack(
                    ws,
                    randomAttackData,
                    this.playerService,
                    true,
                );
            } else if (type === RequestTypes.GAME_SINGLE) {
                const player: Player = this.playerService.findPlayerByWs(ws);
                const bot: Player = this.botService.createBot();
                this.playerService.loginOrRegister(
                    bot.name,
                    bot.password,
                    bot.userWs,
                );

                const createGameResponse = {
                    type: ResponseTypes.GAME_CREATE,
                    data: JSON.stringify({
                        idGame: bot.id,
                        idPlayer: bot.id,
                    }),
                    id: 0,
                };

                ws.send(JSON.stringify(createGameResponse));
            }
        } else {
            return;
        }
    }
}
