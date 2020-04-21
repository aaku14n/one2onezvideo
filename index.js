const express = require("express");
const socketIo = require("socket.io");
const http = require("http");
const path = require("path");

function getRandmNumber() {
  return Math.ceil(Math.random() * 1000);
}

const offerMap = {};

const candidateList = {};
let activeSockets = [];
const app = express();
const number = getRandmNumber();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

const server = http.createServer(app);

server.listen(4000, () => {
  console.log("saerver on 4000");
});

const io = socketIo(server);

io.on("connection", socket => {
  console.log("new client connected");

  const existingSocket = activeSockets.find(
    existingSocket => existingSocket === socket.id
  );

  if (!existingSocket) {
    activeSockets.push(socket.id);

    socket.emit("update-user-list", {
      users: activeSockets.filter(
        existingSocket => existingSocket !== socket.id
      )
    });

    socket.broadcast.emit("update-user-list", {
      users: [socket.id]
    });
  }

  socket.on("disconnect", () => {
    activeSockets = activeSockets.filter(
      existingSocket => existingSocket !== socket.id
    );
    socket.broadcast.emit("remove-user", {
      socketId: socket.id
    });
  });

  socket.on("call-user", data => {
    socket.to(data.to).emit("call-made", {
      offer: data.offer,
      socket: socket.id
    });
  });

  socket.on("make-answer", data => {
    socket.to(data.to).emit("answer-made", {
      socket: socket.id,
      answer: data.answer
    });
  });

  socket.on("offer", function(data) {
    console.log("offer", data);

    offerMap[number] = data;
    socket.emit("offer-reply", number);
  });

  socket.on("start-call", function(data) {
    console.log(offerMap);
    console.log("offer le");
    socket.emit("le-offer", {
      candidateData: candidateList[number],
      offerData: offerMap[data]
    });
  });

  socket.on("answer", function(data) {
    console.log("answer", data);
    socket.broadcast.emit("answer", data);
  });
  socket.on("getId", function(data) {
    let id = getRandmNumber();
    socket.broadcast.emit("userId", id);
  });

  socket.on("candidate", function(data) {
    // console.log("icecandidate", data);
    // socket.broadcast.emit("candidate-reply", data);
    candidateList[number] = data;
  });
});
