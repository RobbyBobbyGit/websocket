#!/usr/bin/env python

import asyncio
import json
import secrets
import random
import http
import os
import signal

from websockets.asyncio.server import serve
from websockets.exceptions import ConnectionClosedOK, ConnectionClosedError


JOIN = {}
WATCH = {}
numberer = 0
nameList = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","William","Elizabeth","David","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen","Christopher","Nancy","Daniel","Lisa","Matthew","Margaret","Anthony","Betty","Mark","Helen","Donald","Dorothy","Steven","Sandra","Paul","Ashley","Andrew","Kimberly","Joshua","Carol","Kenneth","Donna","Kevin","Michelle","Brian","Emily","George","Amanda","Edward","Melissa","Ronald","Deborah","Timothy","Stephanie","Jason","Rebecca","Jeffrey","Laura","Ryan","Cynthia","Jacob","Sharon","Gary","Kathleen","Nicholas","Amy","Eric","Shirley","Jonathan","Anna","Stephen","Angela","Larry","Ruth","Justin","Brenda","Scott","Pamela","Brandon","Nicole","Benjamin","Catherine","Samuel","Katherine","Gregory","Christine","Alexander","Samantha","Patrick","Debra","Frank","Janet","Dennis","Virginia","Jerry","Maria","Tyler","Heather","Aaron","Diane","Jose","Julie","Henry","Frances"]

playerDAT = {}
TICK_INTERVAL = 0.05




def health_check(connection, request):
    if request.path == "/healthz":
        return connection.respond(http.HTTPStatus.OK, "OK\n")
    



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
        print(f"**{join_key}** Initialized client playerDAT ")
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
        print(f"**{join_key}** Sending init packet to host client")
        await websocket.send(json.dumps(event))
        # Receive and process moves from the first player.
        print(f"**{join_key}** Registering host socket for packet handling")
        await play(websocket, game, player, connected, join_key)

    finally: # Try block starts the game loop for the first player,
             # Finally block cleans up game variables on game end
             # ADD ANY NEW CLEANUP FOR HOST IN THIS FINALLY BLOCK
        print(f"**{join_key}** Cleaning up memory")
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
        print("Client attempted to join with invalid join key\nSending error packet to client")
        await error(websocket, "Game not found.")
        return

    # Register to receive moves from this game.
    connected.add(websocket)
    try:
        await play(websocket, game, player, connected, join_key)
    finally: # Second player joins update loop in try with play(),
             # Finally block cleans up and removes player from connected
             # ADD ANY NEW CLEAN UP FOR JOINING PLAYERS IN FINALLY BLOCK
        print(f"**{join_key}** Client removed from connected")
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

            # Debug packets - used to verify server connection
            # and use logs to help with debugging
            match event["type"]:
                case "ping":
                    print("Pinged! sending pong!")
                    await broadcast(connected, {"type": "pong"})
                case "log":
                    print("PACKET LOG: " + event["log"])

            # When non-host clients recieve a start packet,
            # They send back a begin packet to tell the server
            # to begin listening for updates from said non-host client
            if event["type"] == "begin":
                isStarted = True

            # Wait for host to click start button. Server will recieve
            # a start packet when this happens which will open it up
            # for runtime packet handling like update packets
            # Also creates sender_task which periodically sends
            # updates to clients with an interval defined by
            # TICK_INTERVAL (in seconds. 0.05 would be 20 times a second)
            if isStarted == False:
                if event["type"] == "start":
                    print(f"**{join_key}** Recieved start packet from host\n**{join_key}** Assigning names to clients")
                    isStarted = True
                    await sendNames(connected, join_key)
                    sender_task = asyncio.create_task(sendPeriodicUpdate(connected, join_key, TICK_INTERVAL)) #sendPeriodicUpdate(connected, join_key, TICK_INTERVAL)
                else:
                    continue


            # Runtime packets, server starts listening for these
            # after all preliminary listening (init, start, begin...)
            match event["type"]:
                    
                case "update":
                    await getUpdate(connected, event, join_key)

    # Exception handling for "async for message in websocket"
    # Clears up any compute used by play like sender_task
    # to cancel the periodic thread when the host leaves
    # sends logs for clarity                
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
            print(f"**{join_key}** Host websocket connection closed")
            print(f"**{join_key}** Async update loop task closed")
            for ws in connected:
                try:
                    await error(ws, "Host socket closure")
                    print(f"**{join_key}** Notified client of host connection closure")
                except:
                    print(f"**{join_key}** Unexpected error notifying client of closure")
        except UnboundLocalError:
            print(f"**{join_key}** Connection removed from async update loop")









# Is called when the server recieves an "update" packet
# from a client. Changes the game state using relevant
# information stored in "event" and broadcasts the new
# game information back to the players using broadcast()
async def getUpdate(connected, event, join_key):

    playerToUpdate = event["name"]
    curPlayerInfo = playerDAT[join_key][playerToUpdate]
    keyState = event["keyState"]

    
    # Basic input handling, to be refined and moved around later
    try:
        if keyState["KeyW"] == True:
            curPlayerInfo["velY"] = -25
        else:
            raise
    except:
        try:
            if keyState["KeyS"] == True:
                curPlayerInfo["velY"] = + 25
            else:
                raise
        except:
            curPlayerInfo["velY"] = 0

    try:
        if keyState["KeyA"] == True:
            curPlayerInfo["velX"] = -25
        else:
            raise
    except:
        try:
            if keyState["KeyD"] == True:
                curPlayerInfo["velX"] = + 25
            else:
                raise
        except:
            curPlayerInfo["velX"] = 0


    

    playerDAT[join_key][playerToUpdate] = curPlayerInfo







# This looping method is started by the host when the game starts,
# it registers all of the clients in group to recieve periodic updates
# from the server with an interval in seconds of interval_seconds
async def sendPeriodicUpdate(group, join_key, interval_seconds=0.05):

    print(f"**{join_key}** Periodic client update task registered\n**{join_key}** Beginning update loop with tick interval {interval_seconds}...")
    # Loop forever
    while True:


        # TEMP
        # Game state should be handled separately from app.py
        # This is to demonstrate game state handling by the server
        # for future reference
        # Loops though every players data in playerDAT for the game
        # defined by join_key and modifies game state using that information
        for curPlayerName, curPlayerData in playerDAT[join_key].items(): # playerDAT[join_key][curPlayerName]
            try:
                #print(f"player x: {curPlayerData["x"]} velX: {curPlayerData["velX"]} plus: {curPlayerData["x"] + curPlayerData["velX"]}")
                curPlayerData["x"] += curPlayerData["velX"]
            except KeyError:
                curPlayerData["velX"] = 0
            try:
                playerDAT[join_key][curPlayerName]["y"] += curPlayerData["velY"]
            except KeyError:
                curPlayerData["velY"] = 0


        # SEND UPDATE
        # Exceptions for server closure logs and cleanup
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










# Called whenever a new client connects to the server
# Waits until it gets an init packet from the client
# If a new player is starting a game (no code is put 
# into the url) the start() method is called
# If a join code is given, join() will be called and the
# code is passed into join()
# WATCH IS OLD BUT SHOULD BE KEPT FOR REFERENCE
async def handler(websocket):
    # Receive and parse the "init" event from the client
    message = await websocket.recv()
    event = json.loads(message)
    assert event["type"] == "init" # First packet should be init

    if "join" in event:
        # Second player joins an existing game.
        print(f"**{event["join"]}** Connection of type JOIN established")
        await join(websocket, event["join"])
    elif "watch" in event: # OLD (vestigal)
        # Spectator watches an existing game.
        print(f"**{event["watch"]}** Connection of type WATCH established")
        await watch(websocket, event["watch"])
    else:
        try:
            # First player starts a new game.
            print("Connection of type START established\nGenerating new instance...")
            await start(websocket)
        finally:
            pass







# OLD IGNORE, HERE FOR REFERENCE (vestigal)
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
        print("Removing WATCH connection from connected")
        connected.remove(websocket)







# Called first, opens server for websocket connections
# Uses handler method for connections
async def main():
    try:
        port = int(os.environ.get("PORT", "8001"))
        async with serve(handler, "", port, process_request=health_check) as server:
            loop = asyncio.get_running_loop()
            loop.add_signal_handler(signal.SIGTERM, server.close)
            await server.wait_closed()
    except:
        print("Web server connection failed. Defaulting to local host")
        await mainLOCAL()


async def mainLOCAL():
    try:
        async with serve(handler, "", 8001) as server:
            await server.serve_forever()
    except:
        print("Local host failed. Unexpected error occured")



# ENTRANCE POINT
if __name__ == "__main__":
    asyncio.run(main())

