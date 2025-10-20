import { Player } from './player.js';


const colors = ["red", "blue"]
const gameArea = document.getElementById("game-area");
//const canvas = document.createElement("canvas");
//const ctx = canvas.getContext('2d');
const assetPath = {astronaught: {static: "./assets/playerChar/astronaught.gif"}, background: {space: "./assets/background_space.jpg"}, wall: ["./assets/wall_brick.jpg"]}


// Handles local game state
export class Game {

    // this.playerList contains local player data
    // for all players such as position and velocity
    // this.name is the name assigned to the client
    // by the server.
    constructor(websocket, name) {
        this.websocket = websocket;
        this.playerList = {};
        this.name = name;
        this.playerData = {};
        this.defined = {walls: {}, interactables: {}};
        this.itemDivs = {walls: {}, interactables: {}}
        this.ctx;
    }



    resizeCanvas() {
        // Adjust for device pixel ratio for sharper display on high-resolution screens
        const dpr = window.devicePixelRatio || 1; 
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        ctx.scale(dpr, dpr); // Scale the canvas content accordingly

        // Optional: Call your drawing function here to re-render content after resize
        // drawContent(); 
    }


    // Called when server sends start packet to client
    // and gameStart() is called. Sets up Player objects
    // with a div to displaty them on screen: Player(name, div)
    createPlayerList(names, numPlayers) {

        document.body.style.backgroundImage = "url('" + assetPath.background.space + "')";
        document.body.style.backgroundSize = "cover";
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundRepeat = "no-repeat";
        
        //<canvas id="myCanvas" width="500" height="300"></canvas>
        //canvas.id = "mainCanvas";
        //
        //this.resizeCanvas();
        //gameArea.appendChild(canvas)

        for (let i = 0; i < numPlayers; i++) {
            const div = document.createElement("img"); //  <img src="programming.gif" alt="Computer man" style="width:48px;height:48px;"></img>
            let newName = names[i];
            div.className = "playerChar";
            div.src = assetPath.astronaught.static;
            div.alt = `Player_${newName}`;
            gameArea.appendChild(div);

            //`Player ${i + 1}`
            const player = new Player(newName, div, assetPath.astronaught);
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


    stateDefine(newDefine) {
        console.log("newDefine")
        console.log(newDefine)
        try {
            this.defined = { ...this.defined, ...newDefine};
        }
        catch (e) {
            if (e instanceof TypeError) {
                return;
            }
            else {
                console.log("Unexpected error occured during stateDefine()")
            }
        }
    }


    // playerData contains the updated game state
    // Recieved from the server. Updates player object
    // positions and other things later
    draw(updatePacket) {
        this.playerData = updatePacket.players;
        this.define = updatePacket.define;

        //this.define = {walls: {wallTest: {topLeft: [100,100], size: [500, 100], style: 0}}}

        this.stateDefine(this.define);
        this.drawDefined()
        this.drawPlayers(this.playerData);
    }



    drawPlayers() {

        try {
            let curPlayer;
            Object.entries(this.playerData).forEach(([key, value]) => {
                curPlayer = this.playerList[key];
                
                curPlayer.setAnimationAuto(value.velX, value.velY);
                curPlayer.updateCharacterPosition(value.x, value.y);
            });
        }
        catch (e) {
            console.log(`Error encountered while rendering players using playerData:`);
            console.log(this.playerData);
            console.log(e);
            console.log("-----")
        }

    }



    drawDefined() {


        // Iterate over category objects in defined such as
        // the object containing all walls or interactables etc...
        Object.entries(this.defined).forEach(([curCategoryKey, itemsInCategory]) => {

            // Iterate over each item in the current category
            // of outer loop and pass all relevant information
            // into drawItem for rendering
            Object.entries(itemsInCategory).forEach(([itemId, item]) => {
                this.drawItem(curCategoryKey, item, itemId);
            });

        });

    }



    drawItem(category, item, id) {
        console.log("drawItem")
        switch (category) {
            case "walls":
                console.log("walls")
                this.drawWall(item, id);
                return;
            case "interactables":
                this.drawInteractable(item, id);
                return;
            default:
                console.log("drawItem recieved unrecognized item type");
        }

    }

    
    drawWall(item, id) {
        const div = document.createElement("div");
        //const img = document.createElement("img"); //  <img src="programming.gif" alt="Computer man" style="width:48px;height:48px;"></img>
        console.log(`Drawing wall ${id} at (${item.topLeft[0]},${item.topLeft[1]}) size (${item.size[0]},${item.size[1]})`)
        
        div.alt = `wall_${id}`;
        div.style.left = item.topLeft[0] + 'px';
        div.style.top = item.topLeft[1] + 'px';
        div.style.position = "absolute";
        div.style.width = `${item.size[0]}px`
        div.style.height = `${item.size[1]}px`

        div.style.backgroundImage = "url('" + assetPath.wall[item.style] + "')";
        div.style.backgroundSize = "cover";
        div.style.backgroundPosition = "top left";
        div.style.backgroundRepeat = "repeat";
        
        div.className = "wall";
        //div.src = assetPath.wall[item.style];
        gameArea.appendChild(div);
    }


    drawInteractable(item, id) {
        const div = document.createElement("div");
        console.log(`Drawing wall ${id} at (${item.topLeft[0]},${item.topLeft[1]}) size (${item.size[0]},${item.size[1]})`)
        
        div.alt = `interactable_${id}`;
        div.style.left = item.topLeft[0] + 'px';
        div.style.top = item.topLeft[1] + 'px';
        div.style.position = "absolute";
        div.style.width = `${item.size[0]}px`
        div.style.height = `${item.size[1]}px`

        div.style.backgroundImage = "url('" + assetPath.wall[item.style] + "')"; // CHANGE STYLE LATER
        div.style.backgroundSize = "cover";
        div.style.backgroundPosition = "top left";
        div.style.backgroundRepeat = "repeat";
        
        div.className = "interactable";
        //div.src = assetPath.wall[item.style];
        gameArea.appendChild(div);
    }


    
}








