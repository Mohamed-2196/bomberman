export class Player {
  constructor(number,x,y) {
    this.isAlive = true;
    this.number = number;
    this.xPos = x;
    this.yPos = y;
  }

  copyPropertiesFrom(otherPlayer) {
    this.speed = otherPlayer.speed;
    this.lives = otherPlayer.lives;
    this.bombs = otherPlayer.bombs;
    this.range = otherPlayer.range;
    this.isAlive = otherPlayer.isAlive;
    this.xPos = otherPlayer.xPos;
    this.yPos = otherPlayer.yPos;
    this.direction = otherPlayer.direction;
    this.up = otherPlayer.up;
    this.down = otherPlayer.down;
    this.left = otherPlayer.left;
    this.right = otherPlayer.right;
    this.updateImage();

  }

  updateImage() {
    const playerImage = document.getElementById(`player-${this.number}-image`);
    if (playerImage) {
        let imageSrc = '../images/whiteplayermovements/';
        if (this.up) imageSrc += 'walkingup.gif';
        else if (this.down) imageSrc += 'walkingdown.gif';
        else if (this.left) imageSrc += 'walkingleft.gif';
        else if (this.right) imageSrc += 'walkingright.gif';
        else if (this.direction =="death") imageSrc +='death.gif'
        else imageSrc += `standing${this.direction}.png`;

        const currentSrc = playerImage.src.split('/').pop();
        const newSrc = imageSrc.split('/').pop(); 

        if (currentSrc !== newSrc) {
            playerImage.src = imageSrc;
        }
    }
}

  render() {
    return `
      <div id="player-${this.number}" class="player" style="position: absolute; left: ${this.xPos}px; top: ${this.yPos}px;">
        <img id="player-${this.number}-image" src="../images/whiteplayermovements/standingdown.png" />
      </div>
    `;
  }

}



