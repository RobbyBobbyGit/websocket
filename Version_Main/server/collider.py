class Collider:

    def __init__(self, shape = "box", pos = [0, 0], size = [0, 0], collisionType = "solid"):
        self.shape = shape
        self.pos = pos
        self.size = size
        self.collisionType = collisionType

    def setPos(self, pos):
        self.pos = pos

    def isCollidingWith(self, other: object):
        
        if (self.shape == "box" and other.shape == "box"):
            leftSide = self.pos[0] < other.pos[0] + other.size[0]
            rightSide = self.pos[0] + self.size[0] > other.pos[0]
            topSide = self.pos[1] < other.pos[1] + other.size[1]
            bottomSide = self.pos[1] + self.size[1] > other.pos[1]
            return (leftSide and rightSide and topSide and bottomSide)
            #return not (self.pos[0] + self.size[0] < other.pos[0] or self.pos[0] > other.pos[0] + other.size[0] or self.pos[1] + self.size[1] < other.pos[1] or self.pos[1] > other.pos[1] + other.size[1])
        

    def translateThenCollide(self, translate, other):

        self.pos[0] += translate[0]
        self.pos[1] += translate[1]
        if (self.isCollidingWith(other)):
            self.pos[0] -= translate[0]
            self.pos[1] += translate[1]
            return True
        else:
            return False
        
    def collideWithAny(self, others):
        collisions = []
        for [id, other] in others.items():
            #print(f"id: {id}, other: {other} is?: {self.isCollidingWith(other)}")
            if self.isCollidingWith(other):
                collisions.append(id)
            
        return collisions