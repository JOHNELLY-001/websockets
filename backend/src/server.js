import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get('/', (req, res) => {
  res.send('Chat server is running');
});

// store all users for private messaging (optional)
let users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // When a user sets a username
  socket.on("setUsername", (username) => {
    socket.username = username;
    users[socket.id] = username;

    console.log(`${username} joined the chat`);
    io.emit("system", `${username} joined the chat`);
  });

  // Handle chat message
  socket.on("chat message", (msg) => {
    const user = socket.username || "Anonymous";
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const messageData = { user, msg, timestamp };

    io.emit("chat message", messageData);
  });

  // Typing indicator
  socket.on("typing", (isTyping) => {
    if (socket.username) {
      socket.broadcast.emit("typing", {
        user: socket.username,
        isTyping,
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    if (socket.username) {
      console.log(`${socket.username} disconnected`);
      io.emit("system", `${socket.username} left the chat`);
      delete users[socket.id];
    }
  });
});

server.listen(3000, () => console.log("🚀 Chat server running on port 3000"));
