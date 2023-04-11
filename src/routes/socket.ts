import { Socket } from "socket.io";
import { io } from "..";
import { console, utils } from "../utils";

const queue: any = [];
const rooms: any = {};
const names: any = {};
const allUsers: any = {};

io.on("connection", (socket) => {
  const address = socket.handshake.address;
  const socketId = socket.id;

  console.log(`user connected from ${address} with id ${socketId}`);

  socket.on("login", function (data) {
    const username = data?.username;

    if (!username) return socket.emit("login failed", "Username is required");

    if (username && utils.wordCount(username) > 1)
      return socket.emit("login failed", "Username cannot contain spaces");

    if (utils.isUsernameTaken(names, username))
      return socket.emit("login failed", "Username is taken");

    console.log(`user ${username} logged in`);
    socket.emit("login success", username);

    names[socket.id] = data.username;
    allUsers[socket.id] = socket;

    // now check if sb is in queue
    findPeerForLoneSocket(socket);
  });

  socket.on("message", function (data) {
    var room = rooms[socket.id];

    const sender = names[socket.id];

    //create a message id
    const messageId = utils.generateMessageId();

    socket.broadcast
      .to(room)
      .emit("message", { sender, message: data, messageId });
  });

  socket.on("leave room", function () {
    var room = rooms[socket.id];

    socket.broadcast.to(room).emit("chat end");

    // remove room from rooms list
    delete rooms[socket.id];

    var peerID = room.split("#");
    peerID = peerID[0] === socket.id ? peerID[1] : peerID[0];
    // add both current and peer to the queue
    findPeerForLoneSocket(allUsers[peerID]);
    findPeerForLoneSocket(socket);
  });

  socket.on("disconnect", function () {
    var room = rooms[socket.id];

    if (!room) return;

    socket.broadcast.to(room).emit("chat end");
    var peerID = room.split("#");

    peerID = peerID[0] === socket.id ? peerID[1] : peerID[0];
    // current socket left, add the other one to the queue
    findPeerForLoneSocket(allUsers[peerID]);
  });

  socket.on("typing", function (data) {
    var room = rooms[socket.id];
    socket.broadcast.to(room).emit("typing", data);
  });

  socket.on("stop typing", function () {
    var room = rooms[socket.id];
    socket.broadcast.to(room).emit("stop typing");
  });
});

const findPeerForLoneSocket = (socket: Socket) => {
  // this is place for possibly some extensive logic
  // which can involve preventing two people pairing multiple times
  if (queue?.length > 0) {
    // somebody is in queue, pair them!
    var peer = queue.pop();
    var room = socket.id + "#" + peer.id;

    // join them both
    peer.join(room);
    socket.join(room);

    // register rooms to their names
    rooms[peer.id] = room;
    rooms[socket.id] = room;

    // exchange names between the two of them and start the chat
    peer.emit("chat start", { name: names[socket.id], room: room });
    socket.emit("chat start", { name: names[peer.id], room: room });
  } else {
    // queue is empty, add our lone socket
    queue.push(socket);
  }
};
