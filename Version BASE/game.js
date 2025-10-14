import { Player } from '/player.js';


const colors = ["red", "blue"]
const gameArea = document.getElementById("game-area");
// Create keyup and keydown listeners
// At any point, check keyState.ArrowRight or others
// returns true if key is down false if not


export class Game {
    constructor(websocket, players, name) {
        this.websocket = websocket;
        this.players = players;
        this.playerList = {};
        this.name = name
    }



    createPlayerList(names, numPlayers) {

        const containerDiv = document.createElement('div');
        containerDiv.id = 'characters';


        for (let i = 0; i < numPlayers; i++) {
            const div = document.createElement("div");
            div.className = "player";
            div.style.backgroundColor = this.getRandomRgbColor() //colors[i % colors.length];
            gameArea.appendChild(div);

            let newName = names[i];
            //`Player ${i + 1}`
            const player = new Player(newName, div);
            this.playerList[newName] = player;
        }

    }

    getRandomRgbColor() {
        const r = Math.floor(Math.random() * 256); // Random number between 0 and 255 for Red
        const g = Math.floor(Math.random() * 256); // Random number between 0 and 255 for Green
        const b = Math.floor(Math.random() * 256); // Random number between 0 and 255 for Blue

        return `rgb(${r},${g},${b})`; // Returns the RGB color string
    }

    getPlayerMain() {
        return this.playerList[this.name];
    }



    draw(positions) {
        try {
            Object.entries(positions).forEach(([key, value]) => {
                this.playerList[key].updateCharacterPosition(value.x, value.y);
            });
            //for (const curName in positions) {
            //    if (positions.hasOwnProperty(curName)) {
            //        console.log(curName);
            //        nameInfo = positions.curName
            //        this.playerList[curName].updateCharacterPosition(nameInfo.x, nameInfo.y);
            //    }
            //}
        }
        catch (e) {
            console.log("Invalid Positions:");
            console.log(positions);
            console.log(e);
        }
    }
}







    //<div id="character"></div>





