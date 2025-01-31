import { createEventBinding } from '../utils/eventBinding.js' 

export class ChatBox {
    constructor(socket) {
        this.eventBinding = createEventBinding();
        this.socket = socket;
        this.name = null;
    }

    bind() {
        const sendButton = document.querySelector('.chat-input button');
        const chatInput = document.getElementById('chatInput');

        const sendMessage = () => {
            const message = chatInput.value.trim();
            if (message) {
                this.sendMessage(message);
                chatInput.value = '';
            }
        };

        this.eventBinding.bindEvent(sendButton, 'click', sendMessage);

        this.eventBinding.bindEvent(chatInput, 'keypress', (event) => {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });
    }

    sendMessage(message) {
        this.displayMessage(message, true);
        this.socket.emit('chat message', message);
    }

    listenForMessages() {
        this.socket.on('chat message', (msg) => {
            this.displayMessage(msg, false);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.displayMessage('Error: Could not send message', true);
        });
    }

    displayMessage(message, isOwnMessage = false) {
        const messagesContainer = document.getElementById('messages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', isOwnMessage ? 'own-message' : 'other-message');
        messageElement.textContent = message;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    render() {
        return `
        <div class="chat-box">
            <div class="chat-header">BOMBERMAN Chat</div>
            <div class="chat-messages" id="messages">
                <div class="message bot">Welcome to Bomberman Chat!</div>
            </div>
            <div class="chat-input">
                <input type="text" id="chatInput" placeholder="Type a message...">
                <button>Send</button>
            </div>
        </div>
        `;
    }
}
