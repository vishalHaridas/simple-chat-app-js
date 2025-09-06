import express from "express";

export const createChatsRouter = (chatService, userId) => {
  const router = express.Router();
  const USER_ID = userId;

  router.get("/", (req, res) => {
    try {
      const chats = chatService.getAllChats(USER_ID);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch chats", message: error.message });
    }
  });

  router.get("/:chatId", (req, res) => {
    const { chatId } = req.params;
    try {
      const chat = chatService.getAllMessagesFromChat(chatId, USER_ID);
      if (chat) {
        res.json(chat);
      } else {
        res.status(404).json({ error: "Chat not found" });
      }
    } catch (error) {
      console.error(`Error fetching chat ${chatId}:`, error);
      res
        .status(500)
        .json({ error: "Failed to fetch chat", message: error.message });
    }
  });

  return router;
};
