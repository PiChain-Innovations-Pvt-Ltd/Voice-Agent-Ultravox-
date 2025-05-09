import express from "express";
import "dotenv/config";

const port = 3002;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import our routes and mount them
import { router as plivoRoutes } from "./routes/plivo.js";
import { router as makeRoutes } from "./routes/make.js";

app.use("/plivo/", plivoRoutes);
app.use("/make/", makeRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
