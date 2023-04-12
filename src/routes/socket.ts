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

  socket.on("login", (data) => {
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

    // get online users
    getOnlineUsers(socket);
  });

  socket.on("message", (data) => {
    const room = rooms[socket.id];

    const sender = names[socket.id];

    //create a message id
    const messageId = utils.generateMessageId();

    socket.broadcast
      .to(room)
      .emit("message", { sender, message: data, messageId });
  });

  socket.on("leave room", () => {
    const room = rooms[socket.id];

    console.log(`user ${names[socket.id]} left room`);

    socket.broadcast.to(room).emit("chat end");

    // remove room from socket
    socket.leave(room);

    // remove room from rooms list
    delete rooms[socket.id];

    let peerID = room.split("#");
    peerID = peerID[0] === socket.id ? peerID[1] : peerID[0];

    // add both current and peer to the queue
    findPeerForLoneSocket(allUsers[peerID]);
    findPeerForLoneSocket(socket);

    // get online users
    getOnlineUsers(socket);
  });

  socket.once("disconnect", () => {
    const room = rooms[socket.id];

    console.log(`user ${names[socket.id]} disconnected`);

    if (!room) return;

    socket.broadcast.to(room).emit("chat end");
    let peerID = room.split("#");

    // remove room from rooms list
    delete rooms[socket.id];

    // remove name from names list
    delete names[socket.id];

    // remove socket from allUsers list
    delete allUsers[socket.id];

    // remove socket from queue
    queue.splice(queue.indexOf(socket), 1);

    peerID = peerID[0] === socket.id ? peerID[1] : peerID[0];
    // current socket left, add the other one to the queue
    findPeerForLoneSocket(allUsers[peerID]);

    //get online users
    getOnlineUsers(socket);
  });

  socket.on("typing", (data) => {
    const room = rooms[socket.id];
    socket.broadcast.to(room).emit("typing", data);
  });

  socket.on("stop typing", function () {
    const room = rooms[socket.id];
    socket.broadcast.to(room).emit("stop typing");
  });

  socket.on("logout", () => {
    if (!names[socket.id]) return;

    console.log(`user ${names[socket.id]} logged out`);

    // logout user
    const room = rooms[socket.id];

    if (room) {
      delete rooms[socket.id];
      socket.leave(room);

      // add peer to queue
      let peerID = room.split("#");
      peerID = peerID[0] === socket.id ? peerID[1] : peerID[0];

      findPeerForLoneSocket(allUsers[peerID]);
    }

    delete names[socket.id];

    socket.emit("logout success");

    // get online users
    getOnlineUsers(socket);
  });

  socket.on("get online", (data) => {
    getOnlineUsers(socket);
  });
});

const findPeerForLoneSocket = (socket: Socket) => {
  // this is place for possibly some extensive logic
  // which can involve preventing two people pairing multiple times
  if (queue?.length > 0) {
    // somebody is in queue, pair them!
    const peer = queue.pop();
    const room = socket.id + "#" + peer.id;

    // join them both
    peer.join(room);
    socket.join(room);

    // register rooms to their names
    rooms[peer.id] = room;
    rooms[socket.id] = room;

    // exchange names between the two of them and start the chat
    peer.emit("chat start", { name: names[socket.id], room: room });
    socket.emit("chat start", { name: names[peer.id], room: room });

    // get online users
    getOnlineUsers(socket);
  } else {
    // queue is empty, add our lone socket
    queue.push(socket);

    // get online users
    getOnlineUsers(socket);
  }
};

const getOnlineUsers = (socket: Socket) => {
  const onlineUsers = Object.keys(names).map((key) => names[key]);
  // emit to all sockets
  io.emit("get online", {
    onlineUsers,
    amount: onlineUsers.length,
  });
};
