"use strict";

const express = require('express');
const path = require('path');
const ip = require('ip');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));
app.get('/', function(req,res) {
    res.sendFile(path.join(__dirname + '/public/Battleships.html'));
});


app.all('/*',function(req,res){
    res.redirect('/');

});


io.on('connection', function(socket){
    console.log(socket.request.client._peername.address+" connected");
    let campo = [], cpuCampo = [];
    let hits, cpuHits;
    let cpuBoats = 9, userBoats = 9;
    const BOATS = 9;

    function randomBoat(){
        if(cpuBoats === 0) return 0;

        let rand = Math.random();

        if(rand > 0.95){
            cpuBoats--;
            return 1;
        }else return 0;
    }

    socket.on('cleanup', function () {
        hits = 0;
        cpuHits = 0;
        cpuBoats = 9;
        userBoats = 9;
        cpuCampo = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];
    });

    socket.on('cpu-boats', function(){
        while(cpuBoats > 0) {
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {

                    if (cpuCampo[i][j] !== 1) cpuCampo[i][j] = randomBoat();
                }
            }
        }
    });

    socket.on('initialize-user', function(){
        campo = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];
    });

    socket.on('set-boat', function(data){
       if(campo[data.s_line][data.s_column] === 0){
           campo[data.s_line][data.s_column] = 1;
           socket.emit('put-boat', {id:data.id});
           userBoats--;
       }else{
           socket.emit('stack-boat');
       }

       if(userBoats === 0){
           socket.emit('game-start')
       }
    });

    socket.on('user-shot', function(data){
        switch(cpuCampo[data.s_line][data.s_column]){
            case 0:

                cpuCampo[data.s_line][data.s_column] = 2;
                socket.emit('player-water-shot', {id: data.id});
                break;

            case 1:
                cpuCampo[data.s_line][data.s_column] = 3;
                hits++;
                socket.emit('player-boat-shot', {id:data.id});
                break;

            default:
                socket.emit('wasted-shot');
        }
    });

    socket.on('cpu-shot', function (data) {

        switch (campo[data.s_line][data.s_column]){
            case 0:
                campo[data.s_line][data.s_column] = 2;
                socket.emit('cpu-water-shot', {id:data.id});
                break;
            case 1:
                campo[data.s_line][data.s_column] = 3;
                cpuHits++;
                socket.emit('cpu-boat-shot', {id:data.id});
                break;
            default:
                socket.emit('cpu-fail');
                break;
        }
    });

    socket.on('game-state', function () {

        if (hits === BOATS){

            socket.emit('player-win');

        }else if(cpuHits === BOATS){
            socket.emit('cpu-win');
        }
    });

    socket.on('disconnect', function () {
        console.log(socket.request.client._peername.address+" disconnected")
    })
});


http.listen(3000, () => console.log('BattleShips server online at ip '+ip.address()+' port 3000!'));