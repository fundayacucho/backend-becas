import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths to relevant directories
const FRONTEND_PATH = path.resolve(__dirname, "../../bacarios-fundayacucho-frontend");
const BACKEND_PATH = path.resolve(__dirname, "..");
const BRAIN_PATH = "C:/Users/rojas/.gemini/antigravity/brain/29079cb1-059b-44fa-bcd5-43ffd8e44c38";

const server = new Server(
    {
        name: "project-context-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_current_tasks",
                description: "Reads the current task status and project progress from task.md",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_implementation_plans",
                description: "Reads active implementation plans to understand ongoing architectural decisions",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "read_backend_docs",
                description: "Lists and reads key documentation files from the backend (README, guides, etc.)",
                inputSchema: {
                    type: "object",
                    properties: {
                        fileName: { type: "string", description: "Optional specific file name to read" }
                    },
                },
            },
            {
                name: "read_frontend_docs",
                description: "Lists and reads key documentation files from the frontend (README, etc.)",
                inputSchema: {
                    type: "object",
                    properties: {
                        fileName: { type: "string", description: "Optional specific file name to read" }
                    },
                },
            }
        ],
    };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === "get_current_tasks") {
            const content = await fs.readFile(path.join(BRAIN_PATH, "task.md"), "utf-8");
            return { content: [{ type: "text", text: content }] };
        }

        if (name === "get_implementation_plans") {
            const content = await fs.readFile(path.join(BRAIN_PATH, "implementation_plan.md"), "utf-8");
            return { content: [{ type: "text", text: content }] };
        }

        if (name === "read_backend_docs") {
            if (args?.fileName) {
                const content = await fs.readFile(path.join(BACKEND_PATH, args.fileName), "utf-8");
                return { content: [{ type: "text", text: content }] };
            }
            const files = await fs.readdir(BACKEND_PATH);
            const docFiles = files.filter(f => f.endsWith(".md"));
            return { content: [{ type: "text", text: `Backend Documentation Files:\n${docFiles.join("\n")}` }] };
        }

        if (name === "read_frontend_docs") {
            if (args?.fileName) {
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
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);
