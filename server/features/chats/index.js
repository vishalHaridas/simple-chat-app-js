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

  router.post("/", (req, res) => {
    const { text, created_at } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required to create chat" });
    }
    try {
      const newChat = chatService.createNewChat(USER_ID, text, created_at);
      res.status(201).json(newChat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res
        .status(500)
        .json({ error: "Failed to create chat", message: error.message });
    }
  });

  router.post("/:chatId/messages", (req, res) => {
    const { chatId } = req.params;
    const { text, sender, created_at } = req.body;
    if (!text || !sender) {
      return res
        .status(400)
        .json({ error: "Text and sender are required to add message" });
    }
    try {
      const newMessage = chatService.addChatMessage(
        chatId,
        text,
        sender,
        created_at
      );
      res.status(201).json(newMessage);
    } catch (error) {
      console.error(`Error adding message to chat ${chatId}:`, error);
      res
        .status(500)
        .json({ error: "Failed to add message", message: error.message });
    }
  });

  return router;
};
