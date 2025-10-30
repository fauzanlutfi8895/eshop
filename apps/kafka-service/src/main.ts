import { kafka } from "@packages/utils/kafka";
import { updateUserAnalytcs } from "./services/analytics.server";
import express from "express";

// monitoring state
let processedEvents: any[] = [];
const addProcessedEvent = (event: any) => {
  processedEvents.push(event);
  if (processedEvents.length > 100) {
    processedEvents.shift(); // simpan terakhir 100 event
  }
};
const getProcessedEvents = () => processedEvents;

const consumer = kafka.consumer({ groupId: "users-events-group" });

const eventQueue: any[] = [];

const processQueue = async () => {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue.length = 0; // clear buffer

  for (const event of events) {
    if (event.action === "shop_visit") {
      console.log("Update analytics for shop visit:", event);
    }

    const validActions = [
      "product_view",
      "add_to_wishlist",
      "remove_from_cart",
      "add_to_cart",
      "remove_from_wishlist",
    ];
    if (!event.action || !validActions.includes(event.action)) {
      continue;
    }
    try {
      await updateUserAnalytcs(event);
      addProcessedEvent(event); // simpan ke monitor
    } catch (error) {
      console.log("Error processing event: ", error);
    }
  }
};

setInterval(processQueue, 3000);

//kafka consumer for user events
export const consumerKafkaMessages = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "users-events", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString());
      eventQueue.push(event);
    },
  });
};

consumerKafkaMessages().catch(console.error);

// Monitoring server
const app = express();
const PORT = process.env.MONITOR_PORT || 4002;

app.get("/monitor", (req, res) => {
  const events = getProcessedEvents();
  res.json({
    totalEvents: events.length,
    recent: events.slice(-10),
  });
});

app.listen(PORT, () => {
  console.log(`Monitoring server running on port ${PORT}`);
});
