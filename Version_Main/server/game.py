from collider import Collider
from player import Player

class Game:

    def __init__(self):
        self.solidColliders = {}
        self.interactColliders = {}
        self.walls = {}
        self.interactables = {}
        self.changes = {"define": {"walls": {}, "interactables": {}}}
        self.buffers = 3
        self.changePacketBuffers = self.buffers
        self.setWall("wall1", [200, 200], [500, 50], 0)
        self.setInteractable("button1", [400, 300], [50, 50], 0)
        self.players = {}

    def setWall(self, id, pos, size, style):
        col = Collider(shape="box", pos=pos, size=size, collisionType="solid")
        self.solidColliders.update({id: col})
        indexedWallData = {id: {"topLeft": pos, "size": size, "style": style}}
        self.walls.update(indexedWallData)
        self.changes["define"]["walls"].update(indexedWallData)

    def setInteractable(self, id, pos, size, style):
        col = Collider(shape="box", pos=pos, size=size, collisionType="interact")
        self.interactColliders.update({id: col})
        indexedInteractableData = {id: {"topLeft": pos, "size": size, "style": style}}
        self.interactables.update(indexedInteractableData)
        self.changes["define"]["interactables"].update(indexedInteractableData)
        

    def clearChanges(self):
        if self.changePacketBuffers <= 0:
            self.changes = {"define": {"walls": {}, "interactables": {}}}
            self.changePacketBuffers = self.buffers
        else:
            self.changePacketBuffers -= 1


    def addPlayer(self, nameAndData):
        for name, data in nameAndData.items():
            player = Player(data, name)
            self.players[name] = player
            player.data["x"] = 0
            player.data["y"] = 0
            player.data["velX"] = 0
            player.data["velY"] = 0
            print(f"playername: {player.name} playerdata: {player.data}")


    def inputHandler(self, name, keyState):

        player = self.players[name]
        curPlayerInfo = player.data

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

        





    def buildUpdatePacket(self):

        packetPlayerData = {}
        self.moveAndCollide(packetPlayerData)
        
            
        ret = {"type": "update", "players": packetPlayerData, "define": self.changes["define"]}
        return ret
    

    def moveAndCollide(self, packetPlayerData):

        for [name, player] in self.players.items():
            x = player.data["x"]
            y = player.data["y"]
            velX = player.data["velX"]
            velY = player.data["velY"]

            player.collider.setPos([x + velX, y + velY])
            solidCollisionList = player.collideWithAny(self.solidColliders)
            if solidCollisionList != []:
                
                player.collider.setPos([x, y])

            else:
                player.setPos([x+velX, y+velY])

            packetPlayerData[name] = player.data

            interactCollisions = player.collideWithAny(self.interactColliders)
            if interactCollisions != []:
                pass

                



    