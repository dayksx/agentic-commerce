import * as z from "zod";
import { tool } from "langchain";

const emptySchema = z.object({});

export const mockTool = tool(
    async (input: unknown) => {
        emptySchema.parse(input);
        return "";
    },
    {
        name: "mock_tool",
        description: "Mock tool that provide predictive market information.",
        schema: emptySchema as any,
    }
);

