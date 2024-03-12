import nats from "node-nats-streaming";
import { TicketCreatedPublisher } from "./events/ticket-created-publisher";
console.clear();

const stan = nats.connect("artisans", "abc", {
  url: "http://localhost:4222",
});

stan.on("connect", async () => {
  console.log("Publisher connected to NATS");

  const publisher = new TicketCreatedPublisher(stan);
  try {
    const data = {
      id: "123",
      title: "JoeBoy concert from typescript",
      price: 20,
    };
    await publisher.publish(data);
  } catch (err) {
    console.error(err);
  }
});
