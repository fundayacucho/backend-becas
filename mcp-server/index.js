import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const { Pool } = pg;
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const server = new Server(
    {
        name: "fundayacucho-tools",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Lista de herramientas disponibles
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_roles_summary",
                description: "Obtiene un resumen de todos los roles existentes y sus códigos",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_becarios_stats",
                description: "Obtiene estadísticas del número de becarios registrados por tipo",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
        ],
    };
});

/**
 * Manejador de llamadas a herramientas
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;

    try {
        if (name === "get_roles_summary") {
            const result = await pool.query("SELECT id, nombre, codigo, descripcion FROM cat_roles ORDER BY nombre ASC");
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result.rows, null, 2),
                    },
                ],
            };
        }

        if (name === "get_becarios_stats") {
            const result = await pool.query(`
        SELECT 
          tipo_usuario, 
          COUNT(*) as total 
        FROM usuarios 
        WHERE id_rol = 1 
        GROUP BY tipo_usuario
      `);

            const tipoMapa = {
                '1': 'Becario VEN',
                '2': 'Egresado',
                '3': 'Becario EXT'
            };

            const stats = result.rows.map(row => ({
                tipo: tipoMapa[row.tipo_usuario] || `Otro (${row.tipo_usuario})`,
                cantidad: parseInt(row.total)
            }));

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(stats, null, 2),
                    },
                ],
            };
        }

        throw new Error(`Tool not found: ${name}`);
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});

/**
 * Inicio del servidor
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Fundayacucho MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
