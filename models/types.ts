export enum RequestTypes {
    REG = "reg",
    ROOM_CREATE = "create_room",
    ROOM_PLAYER = "add_user_to_room",
    GAME_SHIPS = "add_ships",
    GAME_ATTACK = "attack",
    GAME_RANDOM_ATTACK = "randomAttack",
    GAME_SINGLE = "single_play",
}

export enum ResponseTypes {
    REG = "reg",
    GAME_CREATE = "create_game",
    GAME_START = "start_game",
    GAME_TURN = "turn",
    GAME_ATTACK = "attack",
    GAME_FINISH = "finish",
    ROOMS = "update_room",
    WINNERS = "update_winners",
}

export type updateRoomResponse = {
    roomId: number;
    roomUsers: { name: string; index: number }[];
};

export enum ShipSize {
    SMALL = "small",
    MEDIUM = "medium",
    LARGE = "large",
    HUGE = "huge",
}

export type Ship = {
    position: { x: number; y: number };
    direction: boolean;
    length: number;
    type: ShipSize;
};

export type GameBoard = {
    gameId: number;
    ships: Ship[];
    indexPlayer: number;
};

export type Response = {
    readonly type: ResponseTypes;
    readonly data: string;
    id: 0;
};
