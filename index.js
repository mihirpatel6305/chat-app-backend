import app from "./src/app.js";
import { createServer } from "http";
import setupSocketIO from "./src/websocket/index.js";

const PORT = process.env.PORT || 8000;

const server = createServer(app);

setupSocketIO(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
