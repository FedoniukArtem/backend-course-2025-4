// main.js — Варіант 1 (bank_managers.json)

import { Command } from "commander";
import http from "http";
import fs from "fs/promises";
import { XMLBuilder } from "fast-xml-parser";

const program = new Command();

program
  .requiredOption("-i, --input <path>", "input JSON file")
  .requiredOption("-h, --host <host>", "host")
  .requiredOption("-p, --port <port>", "port");

program.parse(process.argv);
const options = program.opts();

// Перевіряємо чи файл існує
try {
  await fs.access(options.input);
} catch {
  console.error("Cannot find input file");
  process.exit(1);
}

// Створюємо сервер
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${options.host}:${options.port}`);
    const query = url.searchParams;

    const jsonData = JSON.parse(await fs.readFile(options.input, "utf-8"));

    // Фільтрація
    let filtered = jsonData;
    if (query.get("normal") === "true") {
      filtered = filtered.filter(b => b.COD_STATE === "1");
    }

    // Формування структури для XML
    const data = filtered.map(b => {
      const obj = {};
      if (query.get("mfo") === "true") obj.mfo_code = b.MFO;
      obj.name = b.NAME;
      obj.state_code = b.COD_STATE;
      return obj;
    });

    const xmlBuilder = new XMLBuilder({ format: true });
    const xmlContent = xmlBuilder.build({ banks: { bank: data } });

    res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8" });
    res.end(xmlContent);
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal server error");
  }
});

// Запуск сервера
server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});
