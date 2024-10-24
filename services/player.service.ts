export type Player = {
    name: string;
    password: string;
    id: number;
    wins: number;
};

export default class PlayerService {
    private players: Map<string, Player> = new Map<string, Player>();
    private static id: number = 0;

    constructor() {}

    loginOrRegister(name: string, password: string) {
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
            };

            this.players.set(name, newPlayer);

            return {
                name: newPlayer.name,
                index: newPlayer.id,
                error: false,
                errorText: null,
            };
        }
    }

    updateWinners() {
        const winnersArr: { name: string; wins: number }[] = [];

        this.players.forEach((value, key) => {
            winnersArr.push({
                name: value.name,
                wins: value.wins,
            });
        });

        return winnersArr;
    }
}
