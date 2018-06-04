"use strict"; //usa o modo estrito do JavaScript

const myAudio = new Audio('background.mp3'); //inicializa variável de música do jogo
myAudio.volume = 0.4; //deixa um volume suportável na música de fundo
myAudio.loop = true; //configura o som para tocar em loop

const victoryAudio = new Audio('victory.mp3'); //inicializa variável de música do jogo
victoryAudio.volume = 1; //deixa um volume suportável na música de fundo

const defeatAudio = new Audio('defeat.mp3'); //inicializa variável de música do jogo
defeatAudio.volume = 1; //deixa um volume suportável na música de fundo

const container = document.getElementById("user"); //recupera o campo do usuário
const cpu = document.getElementById("computer");  //recupera o campo da cpu
const socket = io();  //inicializa o socket io no lado do cliente, isto foi importado no html
container.style.pointerEvents = "none"; //desativa eventos no campo do usuário

cleanup(); //roda função de inicializar o jogo

/*O framework socket io permite a comunicação entre o servidor e o cliente através de eventos personalizados,
tanto o servidor quando o cliente podem emitir e ouvir eventos, o nome do evento personalizado é o primeiro
parametro da função on, isto configura um listener, ou seja, quem vai ouvir o evento. Para emitir um evento usa-se a
função emit(), para isto gerar resultado, o listener do evento emitido precisa existir
 */

function cleanup(){ //função que inicializa o jogp
    container.innerHTML = ''; //limpa o campo do cliente
    cpu.innerHTML = '';  //limpa o campo da cpu

    container.className = 'container';
    cpu.className = 'container';
    cpu.style.pointerEvents = 'none'; //desativa eventos do campo da cpu

    socket.emit("cleanup"); //envia evento de inicializar o jogo ao servidor

    socket.emit("cpu-boats");  //envia evento de posicionar barcos da cpu ao servidor

    for(let count = 0; count < 10; count++){
        for(let count2 = 0; count2 < 10; count2++){ //cria o campo do usuário
            let element = document.createElement("div");
            element.setAttribute("class", "fieldCell");
            element.setAttribute("id", "cell"+count+count2); //gera id dinamico de acordo com as coordenadas
            element.setAttribute("data-line", count.toString()); //cria atributo da linha
            element.setAttribute("data-column", count2.toString()); //cria atributo da coluna
            container.appendChild(element); //insere célula no container do usuário
        }
    }

    for(let count = 0; count < 10; count++){
        for(let count2 = 0; count2 < 10; count2++){ //cria o campo da cpu
            let element = document.createElement("div");
            element.setAttribute("class", "fieldCellSelf");
            element.setAttribute("id", "cpu"+count+count2); //gera id dinamico de acordo com as coordenadas
            element.addEventListener("click", setUserBoat); //adiciona o evento de colocar barco do usuário a célula
            element.setAttribute("data-line", count.toString()); //cria atributo da linha
            element.setAttribute("data-column", count2.toString()); //cria atributo da coluna
            cpu.appendChild(element); //insere elemento no container da cpu
        }

    }

    document.getElementById('start').style.display = 'block'; //mostra o botão de começar o jogo
    document.getElementById('restart').style.display = 'none'; //esconde o botão de reiniciar o jogo
}

function startGame(event){ //função disparada pelo html

    myAudio.currentTime = 0;
    defeatAudio.pause();
    victoryAudio.pause();
    myAudio.play(); //toca música de fundo

    cpu.style.pointerEvents = 'auto'; //ativa eventos no campo da cpu
    requestUserBoats(); //chama a função de pedir barcos do usuário
    container.style.pointerEvents = "auto"; //ativa eventos no campo do usuário
    event.target.style.display = "none"; //esconde o botão de começar o jogo
}

function setUserBoat(e){ //função que envia os dados de um barco do usuário a ser colocado ao servidor
    let line = e.target.dataset.line; //recupera a coordenada da linha
    let column = e.target.dataset.column;  //recupera a coordenada da coluna
    let target = e.target;

    socket.emit('set-boat', {s_line:line, s_column:column, id:target.id}); //envia evento de colocar barco ao servidor
    //envia um JSON com as coordenadas e a id do elemento ao servidor
}

socket.on('put-boat', function(data){ //evento que controla posicionamento de barco válido do usuário
    let target = document.getElementById(data.id);
    target.setAttribute('class', 'myBoat');
});

socket.on('stack-boat', function(){ //evento que controla posicionamento de barco inválido do usuário
    alert('Barcos não stackam');
});

socket.on('game-start',startGameplay); //evento que começa a fase de tiros do jogo

function startGameplay(){ //função que controla a fase de tiros do jogo
    let blocks = container.children;
    for(let i = 0; i < blocks.length; i++){
        blocks[i].addEventListener("click", shot); //adiciona evento de tiro nas celulas do usuário
        blocks[i].className = 'fieldCellSelf';
    }

    container.className ='container self'; //destaca container do usuário

    let cpuBlocks = cpu.children;
    for(let i = 0; i < cpuBlocks.length; i++){
        cpuBlocks[i].removeEventListener("click", setUserBoat); //remove eventos de colocar barcos do campo da cpu
        if(cpuBlocks[i].className !== 'myBoat') cpuBlocks[i].className = 'fieldCell';
    }

    cpu.className = 'container'; //tira destaque do container da cpu

    alert("Que a batalha comece! Ataque o campo indicado!");
}

function requestUserBoats(){ //função que recebe os barcos do usuários
    socket.emit('initialize-user'); //emite evento para inicializar o campo do usuário ao servidor

    cpu.className = 'container self'; //destaca o campo da cpu

    alert("Clique nos blocos do campo indicado para posicionar 9 barcos"); //pede barcos do usuário
}

function shot(event) { //função que controla os tiros realizados

    play(event); //chama a função de tiro do usuário
    socket.emit('game-state'); //verifica se há um vencedor
}

socket.on('player-win', function () { //evento que controla a vitoria do usuário
    myAudio.pause();
    victoryAudio.currentTime = 0;
    victoryAudio.play();

    window.alert("Você venceu"); //informa o usuário de sua vitória
    container.style.pointerEvents = "none"; //desativa eventos do campo do usuário
    document.getElementById('restart').style.display = 'block'; //mostra o botão de recomeçar o jogo
});

socket.on('cpu-win', function () { //evento que controla a vitoria da cpu
    myAudio.pause();
    defeatAudio.currentTime = 0;
    defeatAudio.play();

    window.alert("Você perdeu"); //informa o usuário de sua derrota
    container.style.pointerEvents = "none"; //desativa eventos do campo do usuário
    document.getElementById('restart').style.display = 'block'; //mostra o botão de recomeçar o jogo
});

function explosion(){ //função que toca o som de explosão quando um barco é atingido
	let audio = new Audio('long-explosion.mp3');
	// noinspection JSIgnoredPromiseFromCall
    audio.play();
}

function cpuPlay(){ //função que controla o tiro da cpu

    let line = Math.floor(Math.random()*10);
    let column = Math.floor(Math.random()*10);
    //seleciona coordenadas aleatórias no campo

    let target = document.getElementById('cpu'+line+column);
    //recupera o elemento escolhido

    socket.emit('cpu-shot', {s_line:line, s_column:column, id:target.id});
    //envia evento de tiro da cpu ao servidor com JSON contendo coordenadas e id do elemento escolhido
}
socket.on('cpu-water-shot', function (data) { //evento que controla tiro na água da cpu
    let target = document.getElementById(data.id);
    target.setAttribute("class", "shotWater");
});

socket.on('cpu-boat-shot', function (data) { //evento que controla tiro no barco da cpu
    let target = document.getElementById(data.id);
    target.setAttribute("class", "shotBoat");
    explosion(); //emite som de explosão
    socket.emit('game-state'); //verifica se houve vencedor
});

socket.on('cpu-fail', function () { //evento que controla tiro inválido da cpu
    cpuPlay(); //força cpu a dar um tiro válido
});

function play(event) { //função que controla o tiro do usuário
    let line = event.target.dataset.line; //recupera linha do tiro
    let column = event.target.dataset.column; //recupera coluna do tiro
    let target = event.target; //recupera elemento do tio
    socket.emit('user-shot', {s_line:line, s_column:column, id:target.id});
    //chama evento de tiro do servidor enviando JSON com coordenadas e id do elemento escolhido
}

socket.on('player-water-shot', function(data){ //evento que controla tiro na água do usuário
    let target = document.getElementById(data.id);
    target.setAttribute("class", "shotWaterSelf");
    cpuPlay(); //chama tiro da cpu
});

socket.on('player-boat-shot', function (data) {  //evento que controla tiro no barco do usuário
    let target = document.getElementById(data.id);
    target.setAttribute("class", "shotBoatSelf");
    explosion(); //emite som de explosão
    cpuPlay(); //chama tiro da cpu
});

socket.on('wasted-shot', function () { //evento que controla tiro inválido do usuário
    window.alert("Pare de desperdiçar torpedos soldado"); //informa o usuário do tiro inválido
    //não chama tiro da cpu para possibilitar o usuário tentar seu tiro novamente
});
