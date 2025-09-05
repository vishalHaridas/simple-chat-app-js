import { Router } from "express";

const createTestConversationHandler = (req, res) => {
  console.log("Test stream endpoint hit");
  console.log("Received message for streaming:", req.body);
  const { messages } = req.body;

  console.log("Messages:", messages);

  if (!messages || !Array.isArray(messages)) {
    res.status(400);
    res.write(
      "Bad Request: 'messages' field is required and should be an array.\n"
    );
    res.end();
    return;
  }

  console.log("Starting to stream messages...");

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write('data: "connected.."\n\n');

  console.log("Headers set, beginning message stream...");

  let counter = 0;
  const interval = setInterval(() => {
    console.log("Sending message", counter + 1);
    if (counter < 5) {
      res.write(
        `data: ${JSON.stringify({
          message: `Test message ${counter + 1}`,
          counter,
        })}\n\n`
      );
      counter++;
    } else {
      res.write(
        `data: ${JSON.stringify({
          message: "Stream complete",
          done: true,
        })}\n\n`
      );
      clearInterval(interval);
      res.end();
    }
  }, 1000);

  res.on("close", () => {
    clearInterval(interval);
  });

  console.log("Message stream initiated.");
};

export default () => {
  const router = Router();

  router.post("/test-stream", (req, res) =>
    createTestConversationHandler(req, res)
  );

  return router;
};
