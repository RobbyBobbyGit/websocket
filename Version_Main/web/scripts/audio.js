export const fxFiles = {player_walk: "walk.mp3"};

export class AudioManager {

    constructor(folderPath) {
        this.folderPath = folderPath;
        this.sounds = {}
    }

    loadFile(filePath, id) {
        this.sounds[id] = new Audio((this.folderPath + filePath));
        console.log("\nsound loaded: ")
        console.log(this.sounds[id])
        console.log("\n")
    }

    play(id, volume=1, loop=false) {
        let sound = this.sounds[id];
        sound.volume = volume;
        sound.loop = loop
        sound.play();
    }

    replay(id, volume=1, loop=false) {
        let sound = this.sounds[id];
        sound.currentTime = 0;
        sound.play(id, volume, loop);
    }

    pause(id) {
        let sound = this.sounds[id];
        sound.pause();
    }

    playCloned(id, volume=1, loop=false) {
        let cloned = this.sounds[id].cloneNode();
        cloned.volume = volume;
        cloned.loop = loop;
        cloned.play();
        cloned.addEventListener('ended', () => {
            this.unloadFile(cloned);
        });
    }

    playLocational(id, soundPos, playerPos, loop=false) {
        console.log(`id: ${id} soundPos: ${soundPos} playerPos: ${playerPos}`)
        let volume = this.getLocationalVolume(soundPos, playerPos)
        if (volume > 0) {
            this.play(id, volume, loop);
        }
        console.log(`locational play volume: ${volume}`)
    }

    getLocationalVolume(pos1, pos2) {
        let simpleDistance = Math.abs(pos1[0]-pos2[0]) + Math.abs(pos1[1]-pos2[1])
        return (1 - Math.min(simpleDistance/400, 1));
    }

    unloadFileId(id) {
        this.unloadFile(this.sounds[id]);
    }

    unloadFile(sound) {
        sound.pause();
        sound.currentTime = 0;
        sound.removeAttribute("src");
        sound.load();
    }

    exists(id) {
        if (this.sounds[id] == undefined) {
            return false;
        }
        else {
            return true
        }
    }
}