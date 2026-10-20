import type { OrderDoc } from "@/lib/models/order";
import { paystackVerify } from "@/lib/payments/paystack";
import { bachsGetCheckout } from "@/lib/payments/bachs";
import { chargeMatches } from "@/lib/payments";
import { decimalStringToMinor, fulfilPaidOrder } from "@/lib/payments/fulfil";

export interface VerifyPaymentResult {
  verified: boolean;
  message: string;
}

/**
 * Verify one order's latest payment attempt against its gateway and fulfil it
 * only when the gateway reports a successful charge of exactly the amount and
 * currency we asked for (ProductReq.md §10.3/§10.5).
 *
 * Shared by the public return-page poller and the admin "Verify with gateway"
 * action, so both paths apply the same safety rules.
 */
export async function verifyOrderPayment(
  order: OrderDoc,
  options: { checkoutId?: string } = {},
): Promise<VerifyPaymentResult> {
  if (order.status !== "pending_payment") {
    return {
      verified: false,
      message: "This order is not awaiting payment.",
    };
  }

  if (order.paymentGateway === "paystack") {
    if (!order.paymentReference) {
      return { verified: false, message: "No Paystack reference on this order." };
    }
    try {
      const v = await paystackVerify(order.paymentReference);
      if (v.status !== "success") {
        return {
          verified: false,
          message: `Paystack reports "${v.status}". The order stays unpaid.`,
        };
      }
      if (!chargeMatches(order, v.amount, v.currency)) {
        await flagMismatch(order);
        return {
          verified: false,
          message:
            "Paystack paid a different amount or currency. The order stays unpaid for review.",
        };
      }
      await fulfilPaidOrder(
        order,
        v.paid_at ? new Date(v.paid_at) : new Date(),
      );
      return { verified: true, message: "Payment verified. The order is paid." };
    } catch (e) {
      return {
        verified: false,
        message: `We couldn't reach Paystack: ${
          e instanceof Error ? e.message : String(e)
        }`,
      };
    }
  }

  if (order.paymentGateway === "bachs") {
    const checkoutId = order.paymentCheckoutId ?? options.checkoutId ?? "";
    if (!checkoutId) {
      return { verified: false, message: "No BACHS checkout on this order." };
    }
    try {
      const session = await bachsGetCheckout(checkoutId);
      const paymentCollected =
        session.payment_status === undefined ||
        session.payment_status === "paid" ||
        // The checkout-session object reports "succeeded"; the
        // checkout.completed event reports "paid" for the same state.
        session.payment_status === "succeeded";
      const paid =
        session.status === "completed" &&
        paymentCollected &&
        chargeMatches(
          order,
          decimalStringToMinor(String(session.amount ?? "")),
          session.currency,
        ) &&
        // A rotated reference means a newer initialize overwrote
        // paymentReference; our refs start with the order number, so that
        // prefix still proves this session was created for this order.
        (!session.reference ||
          session.reference === order.paymentReference ||
          session.reference.startsWith(`${order.orderNumber}-`));

      if (paid) {
        if (!order.paymentCheckoutId) order.paymentCheckoutId = checkoutId;
        await fulfilPaidOrder(order);
        return { verified: true, message: "Payment verified. The order is paid." };
      }
      if (session.status === "completed" && paymentCollected) {
        await flagMismatch(order);
        return {
          verified: false,
          message:
            "BACHS collected a different amount or currency. The order stays unpaid for review.",
        };
      }
      return {
        verified: false,
        message: `BACHS reports "${session.status}". The order stays unpaid.`,
      };
    } catch (e) {
      return {
        verified: false,
        message: `We couldn't reach BACHS: ${
          e instanceof Error ? e.message : String(e)
        }`,
      };
    }
  }

  return { verified: false, message: "This order has no payment gateway yet." };
}

async function flagMismatch(order: OrderDoc): Promise<void> {
  if (order.paymentStatus === "mismatch") return;
  order.paymentStatus = "mismatch";
  await order.save().catch(() => {});
}
