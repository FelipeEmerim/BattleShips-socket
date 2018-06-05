"use strict"; //utiliza o modo estrito do JavaScript

//Para recuperar os elementos usar as posições de 0 a 9
// matriz para controlar o que já foi destruído
// 0 para célula intacta
// 1 para barco
// 2 para tiro na água
// 3 tiro em um barco


const express = require('express'); //importa express
const path = require('path'); //importa caminho
const ip = require('ip');  //importa ip
const app = express();    //inicializa express
const http = require('http').Server(app); //cria servidor http, necessário para usar socket io
const io = require('socket.io')(http); //inicializa e importa socket io

app.use(express.static('public'));  //informa ao express o diretório de arquivos estáticos

app.get('/', function(req,res) { //método que acontece quando cliente acessa a raiz
    res.sendFile(path.join(__dirname + '/public/Battleships.html')); //carrega o html para o cliente
    //_dirname = caminho até o projeto, importado de path
});


app.all('/*', function(req,res){
    res.redirect('/'); //redireciona para raiz em caso de qualquer outra rota

});

/*O framework socket io permite a comunicação entre o servidor e o cliente através de eventos personalizados,
tanto o servidor quando o cliente podem emitir e ouvir eventos, o nome do evento personalizado é o primeiro
parametro da função on, isto configura um listener, ou seja, quem vai ouvir o evento. Para emitir um evento usa-se a
função emit(), para isto gerar resultado, o listener do evento emitido precisa existir
 */
io.on('connection', function(socket){ //cria uma sessão para um cliente que se conecta
    console.log(socket.request.client._peername.address+" connected"); //informa na console
    //inicializa variáveis globais ao cliente

    function randomBoat(){ //função que gera um barco aleatório com 5% de chance
        if(socket['cpuBoats'] === 0) return 0;

        let rand = Math.random();

        if(rand > 0.95){
            socket['cpuBoats']--;
            return 1;
        }else return 0;
    }

    socket.on('cleanup', function () { //evento que inicializa as variaveis antes de o jogo começar
        socket['hits'] = 0;
        socket['cpuHits'] = 0;
        socket['cpuBoats'] = 9;
        socket['userBoats'] = 9;
        socket['BOATS'] = 9;
        socket['cpuCampo'] = [
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

    socket.on('cpu-boats', function(){ //força a cpu a posicionar 9 barcos aleatoriamente
        while(socket['cpuBoats'] > 0) {
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {

                    if (socket['cpuCampo'][i][j] !== 1) socket['cpuCampo'][i][j] = randomBoat();
                }
            }
        }
    });

    socket.on('initialize-user', function(){ //evento que reseta o campo do usuário
        socket['campo'] = [
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

    socket.on('set-boat', function(data){ //evento que posiciona um barco do usuário, recebe as coordenadas em um JSON

       if(socket['campo'][data.s_line][data.s_column] === 0){ //posição válida
           socket['campo'][data.s_line][data.s_column] = 1;
           socket.emit('put-boat', {id:data.id}); //envia o id do elemento através de um JSON para o cliente
           socket['userBoats']--; //diminui contador de barcos a posicionar
       }else{
           socket.emit('stack-boat'); //emite evento de posição inválida
       }

       if(socket['userBoats'] === 0){ //quando todos os barcos estiverem posicionados
           socket.emit('game-start') //emite evento de começar o jogo
       }
    });

    socket.on('user-shot', function(data){ //evento que valida o tiro do usuario,
        //recebe coordenadas e id do elemento através de JSON


        switch (socket['cpuCampo'][data.s_line][data.s_column]) {
            case 0: //tiro na água

                socket['cpuCampo'][data.s_line][data.s_column] = 2; //seta celula para tiro na água
                socket.emit('player-water-shot', {id: data.id}); //emite tiro na água para o cliente
                break;

            case 1: //tiro em barco
                socket['cpuCampo'][data.s_line][data.s_column] = 3; //seta célula para tiro em barco
                socket['hits']++; //aumenta o contador de acertos do cliente
                socket.emit('player-boat-shot', {id: data.id}); //emite tiro em barco para o cliente
                break;

            default: //tiro inválido
                socket.emit('wasted-shot'); //emite evento de tiro inválido para o cliente
        }
    });

    socket.on('cpu-shot', function (data) { //evento que controla o tiro da cpu
//recebe um JSON com as coordenadas do tiro e a id da celula

        switch (socket['campo'][data.s_line][data.s_column]) {
            case 0://tiro na água
                socket['campo'][data.s_line][data.s_column] = 2; //seta celula para tiro na agua
                socket.emit('cpu-water-shot', {id: data.id}); //emite evento de tiro na agua para o cliente
                break;
            case 1: //tiro em barco
                socket['campo'][data.s_line][data.s_column] = 3; //seta celula para tiro em barco
                socket['cpuHits']++; //aumenta o contador de acertos para a cpu
                socket.emit('cpu-boat-shot', {id: data.id}); //emite evento de tiro em barco para o cliente
                break;
            default: //tiro inválido
                socket.emit('cpu-fail'); //emite evento de tiro inválido para o cliente
                break;
        }

    }); //nos dois eventos de tiro SEMPRE é emitido a id do elemento para alterar ao cliente em caso de tiro válido

    socket.on('game-state', function () { //evento que verifica o estado de jogo

        if (socket['hits'] === socket['BOATS']){ //se cliente venceu

            socket.emit('player-win'); //emite evento de vitória do cliente ao cliente

        }else if(socket['cpuHits'] === socket['BOATS']){ //se cpu venceu
            socket.emit('cpu-win'); //emite evento de vitória da cpu ao cliente
        }
    });

    socket.on('disconnect', function () { //quando o cliente se disconectar
        console.log(socket.request.client._peername.address+" disconnected") //imprime na console
    })
});

http.listen(3000, () => console.log('BattleShips server online at ip '+ip.address()+' port 3000!'));
//define porta em que o servidor vai ouvir e o inicializa, printa na console o ip do servidor e sua porta