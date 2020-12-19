export default class User {
    constructor(id, position, score, name, color, side){
        this.id = id;
        this.position = position;
        this.score = score;
        this.name = name;
        this.destination = null;
        this.carryingBox = null;
        this.color = color;
        this.side = side;
    }
}