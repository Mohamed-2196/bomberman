import { io } from "/socket.io/socket.io.esm.min.js";

const socket = io("http://localhost:8080");

export default socket;
