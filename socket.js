const { Server } = require("socket.io");
let io;

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("🟢 مستخدم متصل عبر Socket.io");
      socket.emit("connected", { message: "تم الاتصال بنجاح عبر Socket.io!" });

      socket.on("disconnect", () => {
        console.log("🔴 مستخدم قطع الاتصال");
      });

      // إذا أردت الاستماع لرسائل قادمة من العميل
      socket.on("newMessage", (message) => {
        console.log("📩 رسالة جديدة من العميل:", message);
        if (message.type === "private" && message.userId) {
          io.to(message.userId.toString()).emit("newMessage", message);
        } else {
          io.emit("newMessage", message);
        }
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error("❌ Socket.io غير مهيأ بعد!");
    }
    return io;
  },
};
