require("dotenv").config();
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { console } from "./utils";

const PORT = Number(process.env.PORT) || 3000;

const app = express();

const server = http.createServer(app);
export const io = new Server(server);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

require("./routes/socket");

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
