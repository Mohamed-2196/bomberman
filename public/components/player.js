export class Player {
  constructor(number,x,y) {
    this.speed = 2;
    this.lives = 3;
    this.bombs = 1;
    this.range = 2;
    this.isAlive = true;
    this.number = number;
    this.position = { x: x, y: y }; // Initial position
  }

  render() {
    return `
      <div id="player-${this.number}" class="player" style="position: absolute; left: ${this.position.x}px; top: ${this.position.y}px;">
        <img id="player-${this.number}-image" src="../images/whiteplayermovements/standingdown.png" />
      </div>
    `;
  }

}