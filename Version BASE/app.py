#!/usr/bin/env python

import asyncio
import json
import secrets
import random

from websockets.asyncio.server import serve
from websockets.exceptions import ConnectionClosedOK, ConnectionClosedError


JOIN = {}
WATCH = {}
numberer = 0
nameList = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","William","Elizabeth","David","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen","Christopher","Nancy","Daniel","Lisa","Matthew","Margaret","Anthony","Betty","Mark","Helen","Donald","Dorothy","Steven","Sandra","Paul","Ashley","Andrew","Kimberly","Joshua","Carol","Kenneth","Donna","Kevin","Michelle","Brian","Emily","George","Amanda","Edward","Melissa","Ronald","Deborah","Timothy","Stephanie","Jason","Rebecca","Jeffrey","Laura","Ryan","Cynthia","Jacob","Sharon","Gary","Kathleen","Nicholas","Amy","Eric","Shirley","Jonathan","Anna","Stephen","Angela","Larry","Ruth","Justin","Brenda","Scott","Pamela","Brandon","Nicole","Benjamin","Catherine","Samuel","Katherine","Gregory","Christine","Alexander","Samantha","Patrick","Debra","Frank","Janet","Dennis","Virginia","Jerry","Maria","Tyler","Heather","Aaron","Diane","Jose","Julie","Henry","Frances"]

playerDAT = {}
TICK_INTERVAL = 0.01






# Sends error messages to the client to be handled
async def error(websocket, message):
    """
    Send an error message.

    """
    event = {
        "type": "error",
        "message": message,
    }
    await websocket.send(json.dumps(event))







# Broadcasts message to all websockets in group
async def broadcast(group, message):
    message = json.dumps(message)
    await asyncio.gather(*(c.send(message) for c in group), return_exceptions=True)
#    for websocket in group:
#        await websocket.send(json.dumps(message))








# Called by play() when the host clicks start and 
# subsequently the server recieves a "start" packet
# creates a list of name and initializes the positions of the
# players to be sent back to the clients
# this is used by the clients to create the games state
# or more specifically the list of player() objects
async def sendNames(group, join_key):
    names = []
    tasks = []
    playerDAT[join_key] = {}
    message = {"type": "start"}
    names = nameList[:len(group)]
    i = 0
    for ws in group:
        playerDAT[join_key].update({nameList[i]: {"x": random.randint(0, 400), "y": random.randint(0, 400)}})
        combinedMessage = json.dumps(message | {"name": nameList[i], "names": names})
        tasks.append(ws.send(combinedMessage))
        i += 1
    await asyncio.gather(*tasks)
    #await asyncio.gather(*(group[i].send(json.dumps((message | {"name": names[i], "namesAll": names}))) for i in range(len(group))), return_exceptions=True)









# PLAYER CREATES GAME
# This is called by the handler when an init packet
# is recieved by a client with no join code provided
# Creates a join_key and registers the game state stored
# in game and the list of connected websockets in the JOIN
# array indexed at join_key as a tuple
# Sends an init back to the client with the generated joinkey
# to draw on the webpage
# Calls the play() method and starts listening for related
# packets
async def start(websocket):

    game = 0
    player = 0
    connected = {websocket}

    join_key = secrets.token_urlsafe(6)
    JOIN[join_key] = game, connected

    watch_key = secrets.token_urlsafe(6)
    WATCH[watch_key] = game, connected
    
    try:
        # Send the secret access tokens to the browser of the first player,
        # where they'll be used for building "join" and "watch" links.
        event = {
            "type": "init",
            "join": join_key,
            "watch": watch_key,
        }
        await websocket.send(json.dumps(event))
        # Receive and process moves from the first player.
        await play(websocket, game, player, connected, join_key)

    finally:
        del JOIN[join_key]
        del WATCH[watch_key]








# PERSON JOINS GAME
# Called by handler when the server recieves an init
# packet with a join key provided. Lookes for
# game, connected in the JOIN[] array indexed at the join
# code as set by the start() method
# adds the new websocket to connected (which is in JOIN[join_key])
# calls play() for the new player registering it for packets
async def join(websocket, join_key):
    # Find the Connect Four game.
    player = 0
    try:
        game, connected = JOIN[join_key]
    except KeyError:
        await error(websocket, "Game not found.")
        return

    # Register to receive moves from this game.
    connected.add(websocket)
    try:
        await play(websocket, game, player, connected, join_key)
    finally:
        connected.remove(websocket)









# Called by both start() and join()
# Every player in a game calls this method
# for their given websocket when the init stage
# is passed. Play does some more initialization by
# Waiting for the host to click start. The server will
# then recieve a start packet and call sendNames() 
# to assign all of the connected clients a name
# Clients will then send back a "begin" packet
# telling the play method to begin listening for game related
# events such as "update"
# When the server recieves an "update" packet from a client
# containing information on how to change the game state 
# such as keyState, it will call getUpdate() with this info
# to decide what to do.
async def play(websocket, game, player, connected, join_key):
    isStarted = False

    try:
        async for message in websocket:
            event = json.loads(message)
            #print(event)
            # Wait for host to click start button
            if event["type"] == "begin":
                isStarted = True
            if isStarted == False:
                if event["type"] == "start":
                    isStarted = True
                else:
                    continue
            match event["type"]:
                case "ping":
                    print("Pinged! sending pong!")
                    await broadcast(connected, {"type": "pong"})
                case "log":
                    print("LOG: " + event["log"])
                case "start":
                    #await broadcast(connected, {"type": "start"})
                    await sendNames(connected, join_key)
                    sender_task = asyncio.create_task(sendPeriodicUpdate(connected, join_key, TICK_INTERVAL)) #sendPeriodicUpdate(connected, join_key, TICK_INTERVAL)
                case "update":
                    #await keyPress(event["keyState"])
                    await getUpdate(connected, event, join_key)
                #await websocket.send(json.dumps({"type": "pong"}))
            # Log event
            #column = event["column"]
    except ConnectionClosedOK:
        print("Connection closed gracefully.")
    except ConnectionClosedError as e:
        print(f"Connection closed with error: {e}")
    finally:
        # Ensure the periodic sender task is cancelled when the main handler finishes
        try:
            sender_task.cancel()
        except:
            pass
        try:
            await sender_task  # Await cancellation to handle any cleanup
        except asyncio.CancelledError:
            print("Periodic sender task cancelled.")









# Is called when the server recieves an "update" packet
# from a client. Changes the game state using relevant
# information stored in "event" and broadcasts the new
# game information back to the players using broadcast()
async def getUpdate(connected, event, join_key):
    send = {"type": "update"}

    playerToUpdate = event["name"]
    curPlayerInfo = playerDAT[join_key][playerToUpdate]
    keyState = event["keyState"]

    
    try:
        if keyState["KeyW"] == True:
            curPlayerInfo["velY"] = -5
        else:
            raise
    except:
        try:
            if keyState["KeyS"] == True:
                curPlayerInfo["velY"] = + 5
            else:
                raise
        except:
            curPlayerInfo["velY"] = 0

    try:
        if keyState["KeyA"] == True:
            curPlayerInfo["velX"] = -5
        else:
            raise
    except:
        try:
            if keyState["KeyD"] == True:
                curPlayerInfo["velX"] = + 5
            else:
                raise
        except:
            curPlayerInfo["velX"] = 0


    

    playerDAT[join_key][playerToUpdate] = curPlayerInfo

    #send.update({"players": playerDAT[join_key]})
    
    #await broadcast(connected, send)








async def sendPeriodicUpdate(group, join_key, interval_seconds=0.05):



    while True:

        # TEMP
        # Game state should be handled separately from app.py
        # This is to demonstrate game state handling by the server
        # for future reference
        for curPlayerName, curPlayerData in playerDAT[join_key].items():
            try:
                #print(f"player x: {curPlayerData["x"]} velX: {curPlayerData["velX"]} plus: {curPlayerData["x"] + curPlayerData["velX"]}")
                playerDAT[join_key][curPlayerName]["x"] += playerDAT[join_key][curPlayerName]["velX"]
            except KeyError:
                playerDAT[join_key][curPlayerName]["velX"] = 0
            try:
                playerDAT[join_key][curPlayerName]["y"] += playerDAT[join_key][curPlayerName]["velY"]
            except KeyError:
                playerDAT[join_key][curPlayerName]["velY"] = 0

            playerDAT[join_key][curPlayerName] = curPlayerData

        # SEND UPDATE
        try:
            message = {"type": "update", "players": playerDAT[join_key]}
            await broadcast(group, message)
            await asyncio.sleep(interval_seconds)
        except ConnectionClosedOK:
            print("Connection closed gracefully during periodic send.")
            break
        except ConnectionClosedError as e:
            print(f"Connection closed with error during periodic send: {e}")
            break
        except Exception as e:
            print(f"An unexpected error occurred during periodic send: {e}")
            break

# sender_task = asyncio.create_task(sendPeriodicUpdate(websocket))









# Called whenever a new client connects to the server
# Waits until it gets an init packet from the client
# If a new player is starting a game (no code is put 
# into the url) the start() method is called
# If a join code is given, join() will be called and the
# code is passed into join()
# WATCH IS OLD BUT SHOULD BE KEPT FOR REFERENCE
async def handler(websocket):
    # Receive and parse the "init" event from the UI.
    message = await websocket.recv()
    event = json.loads(message)
    assert event["type"] == "init"

    if "join" in event:
        # Second player joins an existing game.
        await join(websocket, event["join"])
    elif "watch" in event:
        # Spectator watches an existing game.
        await watch(websocket, event["watch"])
    else:
        # First player starts a new game.
        await start(websocket)







# OLD IGNORE, HERE FOR REFERENCE
async def watch(websocket, watch_key):
    try:
        game, connected = WATCH[watch_key]
    except KeyError:
        await error(websocket, "Game not found.")
        return
    # Register to receive moves from this game.
    connected.add(websocket)
    try:
        # REPLAY so spectator can see
        await websocket.wait_closed()
    finally:
        connected.remove(websocket)







# Called first, opens server for websocket connections
# Uses handler method for connections
async def main():
    async with serve(handler, "", 8001) as server:
        await server.serve_forever()


# ENTRANCE POINT
if __name__ == "__main__":
    asyncio.run(main())

