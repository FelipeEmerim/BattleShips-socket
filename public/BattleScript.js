"use strict";

//Para recuperar os elementos usar as posições de 0 a 9
// matriz para controlar o que já foi destruído
// 0 para célula intácta
// 1 para barco
// 2 para tiro na água
// 3 tiro em um barco

const myAudio = new Audio('background.mp3');
myAudio.volume = 0.4;
myAudio.loop = true;
myAudio.play();
const container = document.getElementById("user");
const cpu = document.getElementById("computer");
const socket = io();
container.style.pointerEvents = "none";

cleanup();

function cleanup(){
    container.innerHTML = '';
    cpu.innerHTML = '';

    container.className = 'container';
    cpu.className = 'container';
    cpu.style.pointerEvents = 'none';



    socket.emit("cleanup");

    socket.emit("cpu-boats");

    for(let count = 0; count < 10; count++){
        for(let count2 = 0; count2 < 10; count2++){
            let element = document.createElement("div");
            element.setAttribute("class", "fieldCell");
            element.setAttribute("id", "cell"+count+count2);
            //element.addEventListener("click", setUserBoat);
            element.setAttribute("data-line", count.toString());
            element.setAttribute("data-column", count2.toString());
            container.appendChild(element);
        }
    }

    for(let count = 0; count < 10; count++){
        for(let count2 = 0; count2 < 10; count2++){
            let element = document.createElement("div");
            element.setAttribute("class", "fieldCellSelf");
            element.setAttribute("id", "cpu"+count+count2);
            element.addEventListener("click", setUserBoat);
            element.setAttribute("data-line", count.toString());
            element.setAttribute("data-column", count2.toString());
            cpu.appendChild(element);
        }

    }

    document.getElementById('start').style.display = 'block';
    document.getElementById('restart').style.display = 'none';
}

function startGame(event){

    cpu.style.pointerEvents = 'auto';
    requestUserBoats();
    container.style.pointerEvents = "auto";
    event.target.style.display = "none";
}

function setUserBoat(e){
    let line = e.target.dataset.line;
    let column = e.target.dataset.column;
    let target = e.target;

    socket.emit('set-boat', {s_line:line, s_column:column, id:target.id});
}

socket.on('put-boat', function(data){
    let target = document.getElementById(data.id);
    target.setAttribute('class', 'myBoat');
});

socket.on('stack-boat', function(){
    alert('Barcos não stackam');
});

socket.on('game-start',startGameplay);

function startGameplay(){
    let blocks = container.children;
    for(let i = 0; i < blocks.length; i++){
        blocks[i].addEventListener("click", shot);
        blocks[i].className = 'fieldCellSelf';
    }

    container.className ='container self';

    let cpuBlocks = cpu.children;
    for(let i = 0; i < cpuBlocks.length; i++){
        cpuBlocks[i].removeEventListener("click", setUserBoat);
        if(cpuBlocks[i].className !== 'myBoat') cpuBlocks[i].className = 'fieldCell';
    }

    cpu.className = 'container';

    alert("Que a batalha comece! Ataque o campo indicado!");
}

function requestUserBoats(){
    socket.emit('initialize-user');

    cpu.className = 'container self';

    alert("Clique nos blocos do campo indicado para posicionar 9 barcos");
}

function shot(event) {

    play(event);
    socket.emit('game-state');
}

socket.on('player-win', function () {
    window.alert("Você venceu");
    container.style.pointerEvents = "none";
    document.getElementById('restart').style.display = 'block';
});

socket.on('cpu-win', function () {
    window.alert("Você perdeu");
    container.style.pointerEvents = "none";
    document.getElementById('restart').style.display = 'block';
});

function explosion(){
	let audio = new Audio('long-explosion.mp3');
	// noinspection JSIgnoredPromiseFromCall
    audio.play();
}

function cpuPlay(){

    let line = Math.floor(Math.random()*10);
    let column = Math.floor(Math.random()*10);
    let target = document.getElementById('cpu'+line+column);

    socket.emit('cpu-shot', {s_line:line, s_column:column, id:target.id});
}
socket.on('cpu-water-shot', function (data) {
    let target = document.getElementById(data.id);
    target.setAttribute("class", "shotWater");
});

socket.on('cpu-boat-shot', function (data) {
    let target = document.getElementById(data.id);
    target.setAttribute("class", "shotBoat");
    explosion();
    socket.emit('game-state');
});

socket.on('cpu-fail', function () {
    cpuPlay();
});

function play(event) {
    let line = event.target.dataset.line;
    let column = event.target.dataset.column;
    let target = event.target;
    socket.emit('user-shot', {s_line:line, s_column:column, id:target.id});
}

socket.on('player-water-shot', function(data){
    let target = document.getElementById(data.id);
    target.setAttribute("class", "shotWaterSelf");
    cpuPlay();
});

socket.on('player-boat-shot', function (data) {
    let target = document.getElementById(data.id);
    target.setAttribute("class", "shotBoatSelf");
    explosion();
    cpuPlay();
});

socket.on('wasted-shot', function () {
    window.alert("Pare de desperdiçar torpedos soldado");
});
