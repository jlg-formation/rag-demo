import { createApp } from "./createApp";
import { DataStore } from "./store";

const store = await DataStore.create();
const app = createApp({ store }).listen(Number(process.env.PORT || 3000));

console.log(
  `RAG API running on http://${app.server?.hostname}:${app.server?.port}`
);
