import app from "./index";

const port = parseInt(process.env.PORT ?? "3001");

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};

console.log(`Server is running on http://0.0.0.0:${port}`);