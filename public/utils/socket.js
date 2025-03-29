import { io } from "/socket.io/socket.io.esm.min.js";
// Update the socket URL to your Render app
const socket = io("https://bomberman.onrender.com");

export default socket;