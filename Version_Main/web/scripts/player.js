

// Player class
// Stores local game state data about each
// connected player. this.id is the name
// of the player and the div is the html
// element that displays the player
export class Player {
    constructor(id, div, animationPaths) {
        this.character = div
        this.id = id;
        this.x = 0;
        this.y = 0;
        this.animationPaths = animationPaths;
    }

    setAnimationAuto(velX, velY) {

        if (velY < 0) {
            this.setPlayerAnimationSource(this.animationPaths.static);
        }
        else if (velY > 0) {
            this.setPlayerAnimationSource(this.animationPaths.static);
        }
        else if (velX < 0) {
            this.setPlayerAnimationSource(this.animationPaths.static);
        }
        else if (velX > 0) {
            this.setPlayerAnimationSource(this.animationPaths.static);
        }
        else {
            this.setPlayerAnimationSource(this.animationPaths.static);
        }

    }

    updateCharacterPosition(x, y) { // 1400 x 600
        if (this.x == x && this.y == y) {
            return;
        }
        this.x = x;
        this.y = y;
        
        //this.character.style.left = this.x + 'px';
        //this.character.style.top = this.y + 'px';
        this.character.style.transform = `translate(${x}px, ${y}px)`;
    }

    setPlayerAnimationSource(path) {
        this.character.src = path
    }
}



