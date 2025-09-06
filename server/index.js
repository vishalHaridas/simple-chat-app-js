import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
import providerCall from "./features/providers/index.js";
import createMemoryComponents from "./features/memory/factory.js";
import createConversationsRouter from "./features/conversations/index.js";
import createConversationsService from "./features/conversations/service.js";
import createTestConversationRouter from "./features/conversations/test-router.js";
import createChatsComponents from "./features/chats/factory.js";
import { createChatsRouter } from "./features/chats/index.js";
import { unwrapErr } from "./utils/result.js";

const USER_ID = "default";

const memoryComponents = createMemoryComponents();
const { memoryFacade } = memoryComponents;

const completionsService = createConversationsService(
  memoryFacade,
  providerCall,
  USER_ID
);

const chatsComponents = createChatsComponents();
const { chatService, shutdown } = chatsComponents;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  "/api/completions",
  createConversationsRouter(completionsService, USER_ID)
);
app.use("/api/completions", createTestConversationRouter());
app.use("/api/chats", createChatsRouter(chatService, USER_ID));

app.get("/health", (_, res) => {
  res.json({ status: "OK", message: "LLM Chat Server is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn(
      "⚠️  Warning: OPENROUTER_API_KEY environment variable not set"
    );
  }
});

process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  const results = memoryComponents.shutdown();
  results.push(...shutdown());

  results.forEach((result, index) => {
    if (result.ok) {
      console.log(`Database ${index} closed successfully.`);
    } else {
      console.error(
        `Error closing database ${index}:`,
        result.error,
        unwrapErr(result)
      );
    }
  });
  process.exit();
});
