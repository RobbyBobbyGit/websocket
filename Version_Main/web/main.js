// Module imports
import { Game } from './scripts/game.js'


// Global Variables
let websocket;
let keyState = {};
let numPlayers = 2;
let names = ["Bob", "Hank", "Jasper", "Jack", "Kian"];
let name = ""
let game;
let updatePacket = {}



// Called on page load, Waits for the websocket to
// open (calls websocket "open" event listener)
// and sends init packet to server
// If host starts a new game, sends packet with form:
// {type: "init"}
// if second player joins, sends packet with form:
// {type: "init", join: "JOINCODE"}
// where join code is /?join=____ in the url
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
    console.log(`Sending init packet to server (${event})`)
    websocket.send(JSON.stringify(event));
  });
}






// Called to find server hosted on koyeb.
// if server is hosted locally (used for testing
// prior to web deployment) it returns local host,
// otherwise it returns the url for the koyeb server
function getWebSocketServer() {
  if (window.location.host === "robbybobbygit.github.io") {
    return "wss://unusual-dennie-webgame-f558b6c5.koyeb.app/";
  } else if (window.location.host === "localhost:8000") {
    return "ws://localhost:8001/";
  } else {
    throw new Error(`Unsupported host: ${window.location.host}`);
  }
}




// Unused as of now
function showMessage(message) {
  window.setTimeout(() => window.alert(message), 50);
}




// Called on page load. Sets up event listener
// to listen for packets from server. Uses
// a switch case with event.type to decide
// what to do with recieved packets based
// on their type
function receive() {
  websocket.addEventListener("message", ({ data }) => {

    const event = JSON.parse(data);
    console.log(event)

    switch (event.type) {

      // Client recieves init packet back from server with join and watch code
      // and displays them to the screen in "join" and "watch" html elements
      case "init":
        // Create links for inviting the second player and spectators.
        document.getElementById("join").innerHTML = "Join Code: " + event.join;
        document.getElementById("watch").innerHTML = "Watch Code: " + event.watch;
        break;



      // Used for confirming connect, not used by default
      // added for bug testing
      case "pong":
        console.log("Pong recieved!");
        break;



      // Recieve start packet from server.
      // Happens when host sends start packet to server
      // and server subsequently sends back start packet to
      // each client.
      // Start packet recieved from server comes with the the name
      // assigned to this client and a list of the other clients
      // This name is used in update packets so the server can
      // identify clients
      // Calls gameStart() (see comment at function definition)
      case "start":
        console.log(`Recieved start packet from server. Calling gameStart() (${event})`);
        name = event.name;
        names = event.names;
        numPlayers = event.names.length;
        console.log(`# of players: ${numPlayers} ---- names ${names}`);
        gameStart()
        break;


      // Update packet recieved from server, contains information
      // on how the client should modify the game state such as
      // updated player data like position. The server uses information provided
      // by clients to decide how to update the game state.
      // Each tick (interval defined in app.py server definition) the server
      // broadcasts an update packet to each client
      case "update":
        updatePacket = event
        
        window.requestAnimationFrame(gameLoop);
        break;


      // Recieve end pack from server
      // Can be used for server closure to ensure
      // clean websocket closure, or to kick clients
      // off of connection
      case "end":
        // No further messages are expected; close the WebSocket connection.
        websocket.close(1000);
        break;


      // Sent by server to notify cleints
      // of errors encountered by server
      case "error":
        console.log(event.message);
        if (event.message == "Host socket closure") {
          console.log("Closing websocket")
          websocket.close(1000)
        }
        break;


      // Value at "type" key of event
      // is not recognized by the switch
      // case. Should not happen at runtime
      // Fix imediately if this error is thrown
      default:
        throw new Error(`Unsupported event type: ${event.type}.`);
    }
  });
}






// Called by start button click event listener
// Ignores non-host clients
// For host, sends start packet to server
// to begin the game. See app.py to see how server
// handles the start packet
function startButton() {
  console.log("try: Start")
  if (window.host == true) {
    console.log(`Sending start packet to server`)
    let event = { type: "start" };
    websocket.send(JSON.stringify(event));
  }
  else {
    console.log(`Start packet not sent (window.host != true)`);
  }
}








// When host sends a "start" packet to server, each
// client recieves a "start" packet back and this function
// is called. Registers eventlisteners and sets up local
// game state.
// Sends a begin packet back to server to acknowledge
// the start event and tell the server to listen
// for updates from this client
// Finally runs initial gameLoop call using req anim frame
// to display initial game state without blocking other calls
function gameStart() {

  // Remove main screen elements
  const elementsToRemove = document.querySelectorAll('.init');
  elementsToRemove.forEach(element => {
    element.remove();
  });

  document.addEventListener("keydown",keyHandler);
  document.addEventListener("keyup",keyHandler);
  
  game = new Game(websocket, name);
  game.createPlayerList(names, numPlayers);

  websocket.send(JSON.stringify({type: "begin"}));
  //window.requestAnimationFrame(gameLoop);
}



function gameLoop() {
  game.draw(updatePacket);
}









// BASE KEY HANDLER WITHOUT SPECIFICS
// Sets keyState[e.code] to true if:
// e.type = "keydown"
// and false if: keyState 
// e.type != "keydown"
// function keyHandler(e) {
//     keyState[e.code] = e.type === "keydown";
// } 
//
// Register keyHandler as event handler for key events
// document.addEventListener("keydown",keyHandler)
// document.addEventListener("keyup", keyHandler)
// 
// On any key event, passes the event into key handler
// where keystate indexed at the type of key is set
// to true if the key is down and false if the key is
// up
//
function keyHandler(e){  // simple but powerful


  const old = keyState[e.code] // Save old state

  keyState[e.code] = e.type === "keydown"; // Store new state in keyState


  if (keyState[e.code] == old) { // Comparereturn
    return; // if key didnt change, don't send update packet
    // This code block is here incase there's ever a use for
    // this condition.
  } 

  const send = {type: "update", keyState: keyState, name: game.name};
  websocket.send(JSON.stringify(send));

  
} 
// NOTE: the keydown and keyup event listeners are repeatedly called
// when holding down a key so we must check to make sure a key
// is actually changing from up to down or vise versa before
// sending updated keyState to the server
// This is done by saving the relevent key's state before
// it is updated and comparing the old state to the new state
// keyHandler calls in which the keystate is not changed are disregarded








// Not in use right now, used for loading modules at runtime
// Useful to load a script only when necessary to save resources
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




// FOR NOW only handles start button
// later use this method to set up preliminary
// interactive html elements prior to game start
function buildPage() {
  const button = document.getElementById('start');
    if (button) {
        button.addEventListener('click', () => {
            startButton(websocket)
        });
    }
}





// Called when the page loads (ENTRANCE POINT)
// Opens websocket connection and calls:
// init() - handles init packets and establishes server connection
// revieve() - registers the websocket to listen for packets from server
// send() was removed and replaced. See gameStart()
window.addEventListener("DOMContentLoaded", () => {


  // Initialize the UI.
  // Open the WebSocket connection and register event handlers.
  websocket = new WebSocket(getWebSocketServer());


  // Registers websocket closure listener, just does logs at the moment
  // Add any cleanup code necessary
  websocket.onclose = (event) => {
    console.log('WebSocket connection closed.');
    console.log('Close code:', event.code);
    console.log('Close reason:', event.reason);
    console.log('Was clean closure:', event.wasClean);
  };


  // See comments at each method for specifics
  // Handles connection and registers 
  // packet listening and sending
  buildPage(websocket);
  init(websocket);
  receive(websocket);
});






