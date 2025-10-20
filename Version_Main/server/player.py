from collider import Collider

class Player:

    def __init__(self, playerData, name):
        self.data = playerData
        self.name = name
        self.collider = Collider(pos = [playerData["x"], playerData["y"]], size = [100, 100])
        self.walking = False


    def setPos(self, pos):
        self.data["x"] = pos[0]
        self.data["y"] = pos[1]
        self.collider.setPos(pos)

    def getPos(self):
        return [self.data["x"], self.data["y"]];

    def isCollidingWith(self):
        return self.collider.isCollidingWith()
    
    def collideWithAny(self, others):
        return self.collider.collideWithAny(others)



    


