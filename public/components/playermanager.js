export class PlayerManager {
    constructor() {
        this.players = []; // Ensure players is always an array
    }

    addPlayer(player) {
        this.players.push(player); // Add a player to the array
    }

    updatePlayer(updatedPlayer) {
        const index = this.players.findIndex(p => p.number === updatedPlayer.number);
        if (index !== -1) {
            this.players[index].copyPropertiesFrom(updatedPlayer); // Update existing player
        } else {
            this.addPlayer(new Player(updatedPlayer.number, updatedPlayer.xPos, updatedPlayer.yPos)); // Add new player
        }
    }

    getPlayer(number) {
        return this.players.find(player => player.number === number); // Find a player by number
    }

    removePlayer(number) {
        this.players = this.players.filter(player => player.number !== number); // Remove a player by number
    }

    renderPlayers() {
        const fragment = document.createDocumentFragment();

        this.players.forEach(player => {
            let playerElement = document.getElementById(`player-${player.number}`);
            if (!playerElement) {
                playerElement = document.createElement('div');
                playerElement.id = `player-${player.number}`;

                const playerImage = document.createElement('img');
                playerImage.id = `player-${player.number}-image`;
                playerElement.appendChild(playerImage);

                fragment.appendChild(playerElement);
            }

            playerElement.style.left = `${player.xPos}px`;
            playerElement.style.top = `${player.yPos}px`;
            player.updateImage();
        });

        return fragment;
    }

    getPlayerState() {
        return this.players.map(player => ({
            number: player.number,
            lives: player.lives,
            isAlive: player.isAlive,
            xPos: player.xPos,
            yPos: player.yPos,
        }));
    }
}