require("dotenv").config();
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { console } from "./utils";

import cors from "cors";

const PORT = Number(process.env.PORT) || 5565;

const app = express();

app.use(cors());

const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

require("./routes/socket");

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
