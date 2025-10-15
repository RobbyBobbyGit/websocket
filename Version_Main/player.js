

// Player class
// Stores local game state data about each
// connected player. this.id is the name
// of the player and the div is the html
// element that displays the player
export class Player {
    constructor(id, div) {
        this.character = div
        this.id = id;
        this.x = 0;
        this.y = 0;
    }

    updateCharacterPosition(x, y) {
        this.x = x;
        this.y = y;
        
        this.character.style.left = this.x + 'px';
        this.character.style.top = this.y + 'px';
}
}



