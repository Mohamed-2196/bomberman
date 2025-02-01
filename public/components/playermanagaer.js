export class PlayerManager {
    constructor() {
      this.players = [];
    }
  
    addPlayer(player) {
      this.players.push(player);
    }
  
    renderPlayers() {
        const fragment = document.createDocumentFragment(); // Create a document fragment
      
        this.players.forEach(player => {
          const playerElement = document.createElement('div'); // Create a new div for each player
          playerElement.innerHTML = player.render(); // Set the inner HTML using the player's render method
          fragment.appendChild(playerElement); // Append the player's element to the fragment
        });
      
        return fragment; // Return the fragment containing all player nodes
      }
  
    movePlayer(playerNumber, direction) {
      const player = this.players.find(p => p.number === playerNumber);
      if (player) {
        player.move(direction);
      }
    }
  
    move(direction) {
        switch (direction) {
          case 'up':
            this.position.y -= this.speed;
            break;
          case 'down':
            this.position.y += this.speed;
            break;
          case 'left':
            this.position.x -= this.speed;
            break;
          case 'right':
            this.position.x += this.speed;
            break;
        }
      }
  
    getPlayerState() {
      return this.players.map(player => ({
        number: player.number,
        lives: player.lives,
        isAlive: player.isAlive,
        position: player.position,
      }));
    }
  }