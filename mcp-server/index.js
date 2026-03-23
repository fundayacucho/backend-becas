import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs/promises";
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
            {
                name: "get_current_tasks",
                description: "Lee el estado actual de las tareas y el progreso del proyecto desde task.md",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_implementation_plans",
                description: "Lee los planes de implementación activos para entender las decisiones arquitectónicas actuales",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "read_backend_docs",
                description: "Lista y lee archivos clave de documentación del backend (README, guías, etc.)",
                inputSchema: {
                    type: "object",
                    properties: {
                        fileName: { type: "string", description: "Nombre opcional del archivo específico para leer" }
                    },
                },
            },
            {
                name: "read_frontend_docs",
                description: "Lista y lee archivos clave de documentación del frontend (README, etc.)",
                inputSchema: {
                    type: "object",
                    properties: {
                        fileName: { type: "string", description: "Nombre opcional del archivo específico para leer" }
                    },
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
    const args = request.params.arguments || {};

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

        if (name === "get_current_tasks") {
            const BRAIN_PATH = "C:/Users/rojas/.gemini/antigravity/brain/29079cb1-059b-44fa-bcd5-43ffd8e44c38";
            const content = await fs.readFile(path.join(BRAIN_PATH, "task.md"), "utf-8");
            return { content: [{ type: "text", text: content }] };
        }

        if (name === "get_implementation_plans") {
            const BRAIN_PATH = "C:/Users/rojas/.gemini/antigravity/brain/29079cb1-059b-44fa-bcd5-43ffd8e44c38";
            const content = await fs.readFile(path.join(BRAIN_PATH, "implementation_plan.md"), "utf-8");
            return { content: [{ type: "text", text: content }] };
        }

        if (name === "read_backend_docs") {
            const BACKEND_PATH = path.resolve(__dirname, "..");
            if (args.fileName) {
                const content = await fs.readFile(path.join(BACKEND_PATH, args.fileName), "utf-8");
                return { content: [{ type: "text", text: content }] };
            }
            const files = await fs.readdir(BACKEND_PATH);
            const docFiles = files.filter(f => f.endsWith(".md"));
            return { content: [{ type: "text", text: `Backend Documentation Files:\n${docFiles.join("\n")}` }] };
        }

        if (name === "read_frontend_docs") {
            const FRONTEND_PATH = path.resolve(__dirname, "../../../bacarios-fundayacucho-frontend");
            if (args.fileName) {
                const content = await fs.readFile(path.join(FRONTEND_PATH, args.fileName), "utf-8");
                return { content: [{ type: "text", text: content }] };
            }
            const files = await fs.readdir(FRONTEND_PATH);
            const docFiles = files.filter(f => f.endsWith(".md"));
            return { content: [{ type: "text", text: `Frontend Documentation Files:\n${docFiles.join("\n")}` }] };
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
