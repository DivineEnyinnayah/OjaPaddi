import app from "./index";

const port = parseInt(process.env.PORT ?? "3001");

export default {
  port,
  fetch: app.fetch,
};

console.log(`Server is running on port ${port}`);