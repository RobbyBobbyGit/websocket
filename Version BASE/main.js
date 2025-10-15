
import { Game } from '/game.js'


let keyState = {};
let numPlayers = 2;
let names = ["Bob", "Hank", "Jasper", "Jack", "Kian"];
let name = ""
let game;
let positions = {};


function init() {
  window.host = false;
  websocket.addEventListener("open", () => {
    // Send an "init" event according to who is connecting.
    const params = new URLSearchParams(window.location.search);
    let event = { type: "init" };
    if (params.has("join")) {
      // Second player joins an existing game.
      event.join = params.get("join");
    } else if (params.has("watch")) {
      // Spectator watches an existing game.
      event.watch = params.get("watch");
    } else {
      // First player starts a new game.
      window.host = true;
    }
    showMessage(`Sending init packet to server (${event})`)
    websocket.send(JSON.stringify(event));
  });
}


function getWebSocketServer() {
  if (window.location.host === "RobbyBobbyGit.github.io") {
    return "wss://unusual-dennie-webgame-f558b6c5.koyeb.app/";
  } else if (window.location.host === "localhost:8000") {
    return "ws://localhost:8001/";
  } else {
    throw new Error(`Unsupported host: ${window.location.host}`);
  }
}


function showMessage(message) {
  //window.setTimeout(() => window.alert(message), 50);
  console.log(message);
}

function receive() {
  websocket.addEventListener("message", ({ data }) => {
    const event = JSON.parse(data);
    switch (event.type) {
      case "init":
        // Create links for inviting the second player and spectators.
        document.getElementById("join").innerHTML = "Join Code: " + event.join;
        document.getElementById("watch").innerHTML = "Watch Code: " + event.watch;
        break;
      //case "play":
        // Update the UI with the move.
      //  break;
      case "pong":
        showMessage("Pong recieved!");
        break;

      case "start":
        showMessage(`Recieved start packet from server. Calling gameStart() (${event})`);
        name = event.name;
        names = event.names;
        numPlayers = event.names.length;
        console.log(`# of players: ${numPlayers} ---- names ${names}`);
        gameStart()
        break;

      case "update":
        positions = event.players;
        window.requestAnimationFrame(gameLoop);
        //window.requestAnimationFrame(function() {
        //  gameLoop(positions);
        //});
        break;

      case "end":
        // No further messages are expected; close the WebSocket connection.
        websocket.close(1000);
        break;
      case "error":
        showMessage(event.message);
        break;
      default:
        throw new Error(`Unsupported event type: ${event.type}.`);
    }
  });
}

function send() {
  // Don't send moves for a spectator watching a game.
  const params = new URLSearchParams(window.location.search);
  if (params.has("watch")) {
    return;
  }

  //window.addEventListener("keydown", function (e) {
  //    if (e.altKey) {
  //      websocket.send(JSON.stringify({type: "ping"}))
  //    }
  //});

}




function startButton() {
  console.log("try: Start")
  if (window.host == true) {
    console.log(`Sending start packet to server`)
    //showMessage("Started");
    let event = { type: "start" };
    websocket.send(JSON.stringify(event));
  }
  else {
    showMessage(`Start packet not sent (window.host != true)`);
  }
}



function gameStart() {
  
  // Set character to html element character and load player.js
  // as a worker To handle player movement asyncronously from
  // web socket comunication
  //loadExternalScript("player.js", true)
  //loadExternalScript("game.js", true)
  document.addEventListener("keydown",keyHandler);
  document.addEventListener("keyup",keyHandler);
  
  game = new Game(websocket, numPlayers, name);
  game.createPlayerList(names, numPlayers);

  websocket.send(JSON.stringify({type: "begin"}));
  window.requestAnimationFrame(gameLoop);
}

function gameLoop() {
  game.draw(positions);
}








// BASE KEY HANDLER WITHOUT SPECIFICS
// function keyHandler(e) {
//     keyState[e.code] = e.type === "keydown";
// }
//
// document.addEventListener("keydown",keyHandler)
// document.addEventListener("keyup", keyHandler)
// 
// On any key event, passes the event into key handler
// where keystate indexed at the type of key is set
// to true if the key is down and false if the key is
// up

function keyHandler(e){  // simple but powerful


  const old = keyState[e.code] // Save old state

  keyState[e.code] = e.type === "keydown"; // Store new state in keyState


  if (keyState[e.code] == old) { // Comparereturn
    return; // if key didnt change, don't send update packet
    // This code block is here incase there's ever a use for
    // this condition.
  } 

  const send = {type: "update", keyState: keyState, name: game.name};
  console.log(send);
  websocket.send(JSON.stringify(send));

  
}
// note: the keydown and keyup event listeners are repeatedly called
// when holding down a key so we must check to make sure a key
// is actually changing from up to down or vise versa before
// sending updated keyState to the server





function loadExternalScript(filePath, module) {
  const script = document.createElement('script');
  script.src = filePath;
  //script.type = 'module'; // Optional for modern browsers
  script.async = true; // Optional: Loads script asynchronously without blocking rendering
  if (module) {
    script.type = "module"
  }

  script.onload = () => {
      console.log(`${filePath} loaded successfully.`);
  // You can call functions from the loaded script here if needed
  };

  script.onerror = () => {
      console.error(`Error loading script: ${filePath}`);
  };

  document.head.appendChild(script);
}




function buildPage() {
  const button = document.getElementById('start');
    if (button) {
        button.addEventListener('click', () => {
            startButton(websocket)
        });
    }
}





// Called when the page loads
// Opens websocket connection and calls:
// init() - handles init packets and establishes server connection
// revieve() - registers the websocket to listen for packets from server
// send () - 
window.addEventListener("DOMContentLoaded", () => {
  // Initialize the UI.
  // Open the WebSocket connection and register event handlers.
  const websocket = new WebSocket(getWebSocketServer());
  websocket.onclose = (event) => {
    console.log('WebSocket connection closed.');
    console.log('Close code:', event.code);
    console.log('Close reason:', event.reason);
    console.log('Was clean closure:', event.wasClean);
    // Place any code you want to run on close here
    // For example, attempting to reconnect or cleaning up resources
  };
  buildPage(websocket);
  init(websocket);
  receive(websocket);
  send(websocket);
});