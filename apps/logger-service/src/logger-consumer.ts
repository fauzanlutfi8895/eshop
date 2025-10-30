import { kafka } from "@packages/utils/kafka/index";
import { clients } from "./main";

const consumer = kafka.consumer({ groupId: "log-event-group" });
const logQueue: string[] = [];

// websocket processing function for logs
const processLogs = () => {
  if (logQueue.length === 0) return;

  console.log(`Processing ${logQueue.length} log(s) in batch`);
  const logs = [...logQueue];
  logQueue.length = 0; // clear the queue

  clients.forEach((client) => {
    logs.forEach((log) => {
      client.send(log);
    });
  });
};

setInterval(processLogs, 3000); // process logs every second

// consume log messages from kafka
export const consumeKafkaMessages = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "logs", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const log = message.value.toString();
      logQueue.push(log);
    },
  });
};

// Start Kafka Consumer
consumeKafkaMessages().catch((error: any) => {
  console.error(error);
});
