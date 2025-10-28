import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from "cors"

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors());

// when a user connects
io.on('connection', (socket) => {
    console.log("User connected:", socket.id);

    // store username temporarily on the socket object
    socket.on("setUsername",
        (username) => {
            socket.username = username;
            console.log(`${username} joined the chat`);
            io.emit("User joined", `${username} joined the chat.`)
        }
    )

    socket.on("chat message", (msg) => {
        const user = socket.username || "Anonymous";
        const messageData = { user, msg };
        io.emit("chat message", messageData) //sends message to every one
    });

    socket.on("disconnect", () => {
        if (socket.username) {
            io.emit("user left", `${socket.username} left the chat`);
            console.log(`${socket.username} disconncted`);
        }
    });
});

server.listen(3000, () => {
    console.log("Chat server is running!");
});