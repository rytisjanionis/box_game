export default class Box {
    constructor(id, color, position){
        this.id = id;
        this.color = color;
        this.position = position;
        this.inEndZone = false;
    }
}