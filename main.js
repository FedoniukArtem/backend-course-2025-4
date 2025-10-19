// main.js (частина 1)

import { Command } from "commander";
import fs from "fs/promises";

const program = new Command();

program
  .requiredOption("-i, --input <path>", "input JSON file")
  .requiredOption("-h, --host <host>", "host")
  .requiredOption("-p, --port <port>", "port");

program.parse(process.argv);
const options = program.opts();

// Перевірка чи існує файл
try {
  await fs.access(options.input);
  console.log("✅ File exists:", options.input);
  console.log(`Host: ${options.host}`);
  console.log(`Port: ${options.port}`);
} catch {
  console.error("❌ Cannot find input file");
  process.exit(1);
}
