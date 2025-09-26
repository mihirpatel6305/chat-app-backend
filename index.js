import app from "./src/app.js";
import { createServer } from "http";
import setupSocketIO from "./src/websocket/index.js";

const PORT = 8000;

const server = createServer(app);

setupSocketIO(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO running on ws://localhost:${PORT}`);
});
