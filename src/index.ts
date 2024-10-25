import dotenv from "dotenv";
import { WebSocket, WebSocketServer } from "ws";
import App from "./app";

dotenv.config();

const app = new App();

const PORT: number =
    (process.env.SERVER_PORT && parseInt(process.env.SERVER_PORT)) || 3000;

const websocketServer = new WebSocketServer({ port: PORT }, () => {
    console.log(`WebSocket server is running on port ${PORT}`);
});

websocketServer.on("connection", (ws: WebSocket, req: any) => {
    ws.on("error", (error: string) => {
        console.log(error);
    });

    console.log("Server: connection established");

    ws.on("message", (message: any) => {
        console.log(`Server got the message: ${message}`);

        try {
            app.handleMessage(ws, message.toString());
        } catch (error) {
            console.log(error);
        }
    });

    ws.on("close", () => {
        console.log("Server: connection closed");
    });
});
