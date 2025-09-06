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

  return router;
};
