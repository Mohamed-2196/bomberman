export class Player {
  constructor(number,x,y) {
    this.speed = 2;
    this.lives = 3;
    this.bombs = 1;
    this.range = 2;
    this.isAlive = true;
    this.number = number;
    this.xPos = x;
    this.yPos = y;
    this.direction = "down";
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.playerImages = {
      up: './images/whiteplayermovements/movingup.gif',
      down: './images/whiteplayermovements/movingdown.gif',
      left: './images/whiteplayermovements/movingleft.gif',
      right: './images/whiteplayermovements/movingright.gif',
      idleUp: './images/whiteplayermovements/standingup.png',
      idleDown: './images/whiteplayermovements/standingdown.png',
      idleLeft: './images/whiteplayermovements/standingleft.png',
      idleRight: './images/whiteplayermovements/standingright.png'
    }
    this.playerImage = this.playerImages[this.direction];
  }

  move() {
    const updatepostion = () => {

      const DetectCollision = (user, dx, dy) => {
        const rect1 = user.getBoundingClientRect()
        const nextRect1 = {
          top: rect1.top + dy,
          right: rect1.right + dx,
          bottom: rect1.bottom + dy,
          left: rect1.left + dx
        }

        let walls = document.querySelectorAll('[data-wall="true"]')
        
        for (const wall of walls) {
          const rect2 = wall.getBoundingClientRect()

          if (
            nextRect1.top < rect2.bottom &&
            nextRect1.right > rect2.left &&
            nextRect1.bottom > rect2.top &&
            nextRect1.left < rect2.right
          ) {
            return true
          }
        }
        return false
      }
      
      let dx = 0
      let dy = 0
      

        if (this.up) {
            dy -= this.speed;
            this.direction = "up";
            
        }
        if (this.down) {
            dy += this.speed;
            this.direction = "down";

        }
        if (this.left) {
            dx -= this.speed;
            this.direction = "left";

        }
        if (this.right) {          
            dx += this.speed;
            this.direction = "right"; 

        }

        const playerNum = document.getElementById(`player-${this.number}`)
        


        


        if (!DetectCollision(playerNum, dx, dy)) {
          this.xPos += dx
          this.yPos += dy
          
          playerNum.style.left = `${this.xPos}px`
          playerNum.style.top = `${this.yPos}px`
        } else {
          console.log("collision")
        }

        // Call requestAnimationFrame again
        requestAnimationFrame(updatepostion);
    };

    requestAnimationFrame(updatepostion); // Start the animation
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
  }

  render() {
    return `
      <div id="player-${this.number}" class="player" style="position: absolute; left: ${this.xPos}px; top: ${this.yPos}px;">
        <img id="player-${this.number}-image" src="../images/whiteplayermovements/standingdown.png" />
      </div>
    `;
  }

}