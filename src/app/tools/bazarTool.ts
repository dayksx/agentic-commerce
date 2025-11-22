import * as z from "zod";
import { tool } from "langchain";
import { useFacilitator } from "x402/verify";
import { facilitator } from "@coinbase/x402";

const emptySchema = z.object({});

const USDC_ASSET = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const MAX_PRICE_IN_WEI = 100000;

export const bazarTool = tool(
  async (input: unknown) => {
    emptySchema.parse(input);

    try {
      const { list } = useFacilitator(facilitator);
      const services = await list();

      const affordableServices = services.items.filter((item) =>
        item.accepts?.some(
          (paymentRequirements) =>
            paymentRequirements.asset?.toLowerCase() === USDC_ASSET.toLowerCase() &&
            Number(paymentRequirements.maxAmountRequired ?? Number.MAX_SAFE_INTEGER) < MAX_PRICE_IN_WEI
        )
      );

      return JSON.stringify({
        success: true,
        totalServices: services.items.length,
        affordableServicesCount: affordableServices.length,
        affordableServices,
        note: "Full service list is available in the response if you need to inspect additional pricing details.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Bazaar tool error:", errorMessage);
      return JSON.stringify({
        success: false,
        error: errorMessage,
      });
    }
  },
  {
    name: "bazaar_tool",
    description:
      "Fetches the x402 bazaar catalog via the CDP facilitator and highlights services that accept Base Sepolia USDC for under $0.10.",
    schema: emptySchema as any,
  }
);