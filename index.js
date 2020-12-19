import makeDataAccess from './repos/index.js';
import { arena } from './server/arena';

//var c = document.getElementById("gameScreen");
//var ctx = c.getContext("2d");
//ctx.fillRect(20, 20, 150, 100);

// import { default as mysql } from 'mysql';
// import { default as express } from 'express';
// import * as Http from 'http';
// import { default as socket } from 'socket.io';
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const mysql = require('mysql');
var path = require('path');

const { msgDb/*, coordinatesDb, ir t.t.*/ } = makeDataAccess(mysql);
const gameArena = arena(io); 
gameArena.start();


// io.on('connection', (socket) => {
//   console.log('a user connected');
//   socket.on('disconnect', () => {
//     console.log('user disconnected');
//   });
//   socket.on('chat message', (msg) => {
//       var d = new Date();
//       msgDb.addMessage({
//           message: msg,
//           author: socket.client.id.toString(),
//           date: d.toLocaleDateString()
//       }).then(id => {
//         console.log('message: ' + msg + " id:" + id);
//         io.emit('chat message', msg + " id:" + id);
//       })
//     });
// });


app.use(express.static(path.join(__dirname, 'public')));

// app.get('/', (req, res) => {
//   //res.sendFile(__dirname + '/public/index.html');
//   res.redirect('/public/index.html');
// });

app.get('/', (req, res) => {
  //res.sendFile(__dirname + '/index.html');
  res.redirect('/public/index.html');
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});