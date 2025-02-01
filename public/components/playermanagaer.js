export class PlayerManager {
    constructor() {
      this.players = [];
    }
  
    addPlayer(player) {
      this.players.push(player);
      
    }

    updatePlayer(player){
      
      this.players.forEach((p) => {
        
        if(p.number === player.number){
          p.copyPropertiesFrom(player);
          
          }
    });}


   
  
    renderPlayers() {
        const fragment = document.createDocumentFragment(); // Create a document fragment
      console.log(99);
      
        this.players.forEach(player => {
          const playerElement = document.createElement('div'); // Create a new div for each player
          playerElement.innerHTML = player.render(); // Set the inner HTML using the player's render method
          fragment.appendChild(playerElement); // Append the player's element to the fragment
        });
        this.movePlayers();

        return fragment; // Return the fragment containing all player nodes
      }
  
    movePlayers() {
      
      this.players.forEach(player => {        
        player.move();
      });
    }
  
    // move(direction) {
    //     switch (direction) {
    //       case 'up':
    //         this.position.y -= this.speed;
    //         break;
    //       case 'down':
    //         this.position.y += this.speed;
    //         break;
    //       case 'left':
    //         this.position.x -= this.speed;
    //         break;
    //       case 'right':
    //         this.position.x += this.speed;
    //         break;
    //     }
    //   }
  
    getPlayerState() {
      return this.players.map(player => ({
        number: player.number,
        lives: player.lives,
        isAlive: player.isAlive,
        xPos: player.xPos, // Include x position
        yPos: player.yPos, // Include y position
      }));
    }
  }