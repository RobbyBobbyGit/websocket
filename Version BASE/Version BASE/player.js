

//export function updateCharacterPosition() {
//    if(keyState.ArrowRight){
//        console.log("right");
//        charX += speed;
//    }
//    else if (keyState.ArrowLeft) {
//        charX += -1 * speed;
//    }
//    //charX += 1;
//    character.style.left = charX + 'px';
//    character.style.top = charY + 'px';
//}



export class Player {
    constructor(id, div) {
        this.character = div //document.getElementById('character');
        this.id = id;
        this.x = 0;
        this.y = 0;
    }

    updateCharacterPosition(x, y) {
        this.x = x;
        this.y = y;
        //this.div.style.transform = `translate(${x}px, ${y}px)`;

        //charX += 1;
        this.character.style.left = this.x + 'px';
        this.character.style.top = this.y + 'px';
}
}



