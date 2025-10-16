import { Player } from './player.js';


const colors = ["red", "blue"]
const gameArea = document.getElementById("game-area");
const assetPath = {astronaught: {static: "./assets/astronaught.gif"}, background: {space: "./assets/background_space.jpg"}}


// Handles local game state
export class Game {

    // this.playerList contains local player data
    // for all players such as position and velocity
    // this.name is the name assigned to the client
    // by the server.
    constructor(websocket, name) {
        this.websocket = websocket;
        this.playerList = {};
        this.name = name
    }


    // Called when server sends start packet to client
    // and gameStart() is called. Sets up Player objects
    // with a div to displaty them on screen: Player(name, div)
    createPlayerList(names, numPlayers) {

        document.body.style.backgroundImage = "url('" + assetPath.background.space + "')";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundRepeat = "no-repeat";

        const containerDiv = document.createElement('div');
        containerDiv.id = 'characters';


        for (let i = 0; i < numPlayers; i++) {
            const div = document.createElement("img"); //  <img src="programming.gif" alt="Computer man" style="width:48px;height:48px;"></img>
            let newName = names[i];
            div.className = "playerChar";
            div.src = assetPath.astronaught.static;
            div.alt = `Player_${newName}`;
            gameArea.appendChild(div);

            //`Player ${i + 1}`
            const player = new Player(newName, div);
            this.playerList[newName] = player;
        }

    }


    // You know what this does...
    getRandomRgbColor() {
        const r = Math.floor(Math.random() * 256); // Random number between 0 and 255 for Red
        const g = Math.floor(Math.random() * 256); // Random number between 0 and 255 for Green
        const b = Math.floor(Math.random() * 256); // Random number between 0 and 255 for Blue

        return `rgb(${r},${g},${b})`; // Returns the RGB color string
    }


    // This to :)
    getPlayerMain() {
        return this.playerList[this.name];
    }


    // playerData contains the updated game state
    // Recieved from the server. Updates player object
    // positions and other things later
    draw(playerData) {
        try {
            Object.entries(playerData).forEach(([key, value]) => {
                this.playerList[key].updateCharacterPosition(value.x, value.y);
            });
        }
        catch (e) {
            console.log("Invalid Positions:");
            console.log(playerData);
            console.log(e);
        }
    }
}







    //<div id="character"></div>





