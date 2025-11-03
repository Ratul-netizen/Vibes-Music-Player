const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const nextPort = parseInt(process.env.PORT || "3000", 10);
const wsPort = parseInt(process.env.WS_PORT || "4000", 10);

// Prepare the Next.js app
const app = next({ dev, hostname, port: nextPort });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server for Next.js
  const nextHttpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Start the Next.js HTTP server
  nextHttpServer.listen(nextPort, (err) => {
    if (err) throw err;
    console.log(`✓ Next.js Ready on http://${hostname}:${nextPort}`);
  });

  // Create a separate HTTP server for Socket.IO
  const wsHttpServer = createServer();
  const io = new Server(wsHttpServer, {
    cors: {
      origin: `http://${hostname}:${nextPort}`,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket.IO event handling
  io.on("connection", (socket) => {
    console.log(`[Socket.IO] ✓ Client connected: ${socket.id}`);

    // Broadcast playlist events
    socket.on("track:add", (data) => {
      socket.broadcast.emit("track:added", data);
    });

    socket.on("track:remove", (data) => {
      socket.broadcast.emit("track:removed", data);
    });

    socket.on("track:vote", (data) => {
      socket.broadcast.emit("track:voted", data);
    });

    socket.on("track:reorder", (data) => {
      socket.broadcast.emit("track:reordered", data);
    });

    socket.on("track:playing", (data) => {
      socket.broadcast.emit("track:playing", data);
    });

    socket.on("user:join", (data) => {
      socket.broadcast.emit("user:joined", data);
    });

    socket.on("user:leave", (data) => {
      socket.broadcast.emit("user:left", data);
    });

    socket.on("message:send", (data) => {
      socket.broadcast.emit("message:sent", data);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });

    socket.on("error", (error) => {
      console.error(`[Socket.IO] Socket error for ${socket.id}:`, error);
    });
  });

  // Heartbeat ping every 15s
  setInterval(() => {
    const ts = new Date().toISOString();
    io.emit("ping", { type: "ping", ts });
  }, 15000);

  // Start the Socket.IO HTTP server
  wsHttpServer.listen(wsPort, (err) => {
    if (err) throw err;
    console.log(`✓ Socket.IO Ready on ws://${hostname}:${wsPort}`);
    console.log(`  Use 'NEXT_PUBLIC_WS_URL=http://${hostname}:${wsPort}' in your .env.local`);
  });
});

