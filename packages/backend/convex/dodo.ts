import {
  DodoPayments,
  type DodoPaymentsClientConfig,
} from "@dodopayments/convex";
import { components, internal } from "./_generated/api";
import { authComponent } from "./lib/betterAuth";
import { getDodoEnvironment } from "./features/dodo/env";

export const dodo = new DodoPayments(components.dodopayments, {
  identify: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const customer = await ctx.runQuery(
      internal.features.dodo.queries.getBillingCustomer,
      { authUserId: user._id },
    );

    if (!customer?.dodoCustomerId) {
      return null;
    }

    return {
      dodoCustomerId: customer.dodoCustomerId,
    };
  },
  apiKey: process.env.DODO_PAYMENTS_API_KEY ?? "",
  environment: getDodoEnvironment(),
} as DodoPaymentsClientConfig);

export const { checkout, customerPortal } = dodo.api();
