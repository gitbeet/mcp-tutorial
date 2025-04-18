import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import z from "zod";

// Crear el servidor
// Es la interfaz principal con el protocolo MCP
const server = new McpServer({
  name: "Demo",
  version: "1.0.0",
});

// Definir las herramientas
// Las herramientas le permite al LLM realizar acciones a través de tu servidor
server.tool(
  "fetch-weather",
  "Tool to fetch the weather of a city",
  {
    city: z.string().describe("City name"),
  },
  async ({ city }) => {
    const coordinatesResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=en&format=json`
    );
    const coordinateData = await coordinatesResponse.json();

    if (coordinateData.results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No se encontró información para la ciudad ${city}`,
          },
        ],
      };
    }

    const { latitude, longitude } = coordinateData.results[0];

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&current=temperature_2m,precipitation,rain,is_day`
    );

    const weatherData = await weatherResponse.json();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(weatherData, null, 2),
        },
      ],
    };
  }
);

// Escuchar las conexiones del cliente
const transport = new StdioServerTransport();
await server.connect(transport);
