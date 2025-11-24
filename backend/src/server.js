import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.send("Chat server is running");
});

// store all users for private messaging AND online list
let users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // When a user sets a username
  socket.on("setUsername", (username) => {
    socket.username = username;
    users[socket.id] = username;

    console.log(`${username} joined the chat`);
    io.emit("system", `${username} joined the chat`);

    // 👉 ADD: Send updated online users list
    io.emit("onlineUsers", users);
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

      // 👉 ADD: Send updated online users list
      io.emit("onlineUsers", users);
    }
  });
});

// Listen
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});