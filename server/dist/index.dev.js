"use strict";

var express = require('express');

var socketio = require('socket.io');

var http = require('http');

var _require = require('./users'),
    addUser = _require.addUser,
    removeUser = _require.removeUser,
    getUser = _require.getUser,
    getUsersInRoom = _require.getUsersInRoom;

var PORT = process.env.PORT || 3200;
var app = express();
var server = http.createServer(app);

var router = require('./router');

var io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});
io.on('connect', function (socket) {
  socket.on('join', function (_ref, callback) {
    var name = _ref.name,
        room = _ref.room;

    var _addUser = addUser({
      id: socket.id,
      name: name,
      room: room
    }),
        error = _addUser.error,
        user = _addUser.user;

    if (error) return callback(error);
    socket.join(user.room);
    socket.emit('message', {
      user: 'admin',
      text: "".concat(user.name, " welcome to the ").concat(user.room)
    });
    socket.broadcast.to(user.room).emit('message', {
      user: 'admin',
      text: "".concat(user.name, " has joined!")
    });
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });
    console.log(message);
    callback();
  });
  socket.on('sendMessage', function (message, callback) {
    var user = getUser(socket.id);
    io.to(user.room).emit('message', {
      user: user.name,
      text: message
    });
    callback();
  });
  socket.on('disconnect', function () {
    var user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', {
        user: 'Admin',
        text: "".concat(user.name, " has left.")
      });
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});
app.use(router);
server.listen(PORT, function () {
  return console.log("Server has started on port ".concat(PORT));
});