import { Player, ResponseTypes } from "../models/types";
import { WebSocket } from "ws";

export default class BotService {
    private static id = -1;

    constructor() {}

    generateRandomHexString(length: number): string {
        let result: string = "";
        const characters = "0123456789abcdef";

        for (let i: number = 0; i < length; i++) {
            const randomIndex: number = Math.floor(
                Math.random() * characters.length,
            );
            result += characters.charAt(randomIndex);
        }

        return result;
    }

    generateRandomUrl(): string {
        return `ws://localhost:3000/${this.generateRandomHexString(20)}`;
    }

    createBot(): Player {
        return {
            id: BotService.id--,
            wins: 0,
            name: this.generateRandomHexString(20),
            password: this.generateRandomHexString(20),
            userWs: new WebSocket(this.generateRandomUrl()),
        };
    }
}
