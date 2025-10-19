// main.js варіант 1 (bank_managers.json)

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

//Перевіряємо, чи існує вхідний файл
try {
  await fs.access(options.input);
} catch {
  console.error("Cannot find input file");
  process.exit(1);
}

//Створюємо HTTP-сервер
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${options.host}:${options.port}`);
    const query = url.searchParams;

    // Читаємо JSON-файл
    const jsonData = JSON.parse(await fs.readFile(options.input, "utf-8"));

    //Фільтрація за станом
    let filtered = jsonData;
    if (query.get("normal") === "true") {
      filtered = filtered.filter(b => String(b.COD_STATE) === "1");
    }

    //Формуємо структуру для XML
    const data = filtered.map(b => {
      const obj = {};

      // Якщо ?mfo=true — додаємо код банку
      if (query.get("mfo") === "true") obj.mfo_code = b.MFO;

      // Додаємо назву банку
      obj.name = b.SHORTNAME || b.FULLNAME || "Unknown Bank";

      // Додаємо стан банку (як число та текст)
      obj.state_code = b.COD_STATE;
      obj.state_name = b.NAME_STATE || "Unknown";

      return obj;
    });

    //Формуємо XML
    const xmlBuilder = new XMLBuilder({ format: true });
    const xmlContent = xmlBuilder.build({ banks: { bank: data } });

    // Відповідь серверу
    res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8" });
    res.end(xmlContent);

  } catch (err) {
    console.error("Server error:", err);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal server error");
  }
});

// 🚀 Запускаємо сервер
server.listen(options.port, options.host, () => {
  console.log(`✅ Server running at http://${options.host}:${options.port}/`);
});
