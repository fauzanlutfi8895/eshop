import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "kafka-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});
