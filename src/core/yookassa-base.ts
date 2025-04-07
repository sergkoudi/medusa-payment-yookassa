import {
  IAmount,
  ICapturePayment,
  IConfirmationType,
  ICreatePayment,
  ICreateRefund,
  IPaymentMethodData,
  YooCheckout,
} from "@a2seven/yoo-checkout";
import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  WebhookActionData,
  WebhookActionResult,
  RefundPaymentInput,
  RefundPaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  RetrievePaymentOutput,
  RetrievePaymentInput,
  IBigNumber,
} from "@medusajs/framework/types";

type YooKassaOptions = {
  shopId: string;
  secretKey: string;
};

export abstract class YooKassaProvider extends AbstractPaymentProvider<YooKassaOptions> {
  static identifier = "YooKassa";

  protected readonly options: YooKassaOptions;
  protected readonly checkout: YooCheckout;
  protected readonly container: Record<string, unknown>;

  constructor(container: Record<string, unknown>, options: YooKassaOptions) {
    super(container, options);
    YooKassaProvider.validateOptions(options);
    this.options = options;
    this.container = container;
    this.checkout = new YooCheckout({
      shopId: options.shopId,
      secretKey: options.secretKey,
    });
  }

  static validateOptions(options: Partial<YooKassaOptions>): void {
    if (!options.shopId || !options.secretKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "SHOP_ID and SECRET_KEY are required in the provider's options."
      );
    }
  }

  /**
   * Capture an existing payment.
   */
  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const paymentId = input.data?.id as string;
    const payload = input.data?.payload as ICapturePayment;
    const idempotencyKey = input.context?.idempotency_key;

    try {
      const response = await this.checkout.capturePayment(paymentId, payload, idempotencyKey);
      return { data: response as unknown as Record<string, unknown> };
    } catch (error) {
      throw this.createError("Capture payment failed", error as Error);
    }
  }

  /**
   * Retrieve payment status and map it to Medusa status.
   */
  async getPaymentStatus({ data }: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const id = data?.id as string;
    if (!id) {
      throw this.createError("No payment intent ID provided while getting payment status", new Error("Missing ID"));
    }

    try {
      const payment = await this.checkout.getPayment(id);
      const paymentData = payment as unknown as Record<string, unknown>;

      switch (payment.status) {
        case "pending":
          return { status: PaymentSessionStatus.PENDING, data: paymentData };
        case "canceled":
          return { status: PaymentSessionStatus.CANCELED, data: paymentData };
        case "waiting_for_capture":
          return { status: PaymentSessionStatus.AUTHORIZED, data: paymentData };
        case "succeeded":
          return { status: PaymentSessionStatus.CAPTURED, data: paymentData };
        default:
          return { status: PaymentSessionStatus.PENDING, data: paymentData };
      }
    } catch (error) {
      throw this.createError("Failed to get payment status", error as Error);
    }
  }

  /**
   * Initiate a new payment.
   */
  async initiatePayment({
    currency_code,
    amount,
    data,
    context,
  }: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const createPayload: ICreatePayment = {
      amount: {
        value: amount as string,
        currency: currency_code,
      },
      payment_method_data: data?.bank_card as IPaymentMethodData,
      confirmation: {
        type: data?.confirmation_type as IConfirmationType,
        return_url: data?.return_url as string,
      },
      ...data,
    };

    try {
      const response = await this.checkout.createPayment(createPayload, context?.idempotency_key);
      // Если объект содержит id, считаем его платежным намерением
      const paymentId = "id" in response ? response.id : (data?.session_id as string);
      return {
        id: paymentId,
        data: response as unknown as Record<string, unknown>,
      };
    } catch (error) {
      throw this.createError("Initiate payment failed", error as Error);
    }
  }

  /**
   * Authorize a payment by retrieving its status.
   */
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    return this.getPaymentStatus(input.context as unknown as GetPaymentStatusInput);
  }

  /**
   * Cancel an existing payment.
   */
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const paymentId = input.data?.id as string;
    const idempotencyKey = input.context?.idempotency_key;

    try {
      const response = await this.checkout.cancelPayment(paymentId, idempotencyKey);
      return { data: response as  unknown as Record<string, unknown> };
    } catch (error) {
      throw this.createError("Cancel payment failed", error as Error);
    }
  }

  /**
   * Retrieve a payment by ID.
   */
  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    try {
      const payment = await this.checkout.getPayment(input.data?.id as string);
      return payment as unknown as Record<string, unknown>;
    } catch (error) {
      throw this.createError("Failed to retrieve payment", error as Error);
    }
  }

  /**
   * Refund a payment.
   */
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const paymentId = input.data?.id as string;
    const amount = input.amount as IBigNumber;
    const refundPayload = {
      payment_id: paymentId,
      amount: {
        value: amount.toString(),
        currency: input.data?.currency_code as string,
      },
    };

    try {
      const refund = await this.checkout.createRefund(refundPayload, input.context?.idempotency_key);
      return { data: refund as unknown as Record<string, unknown> };
    } catch (error) {
      throw this.createError("Refund failed", error as Error);
    }
  }

  /**
   * Deletion of payments is not supported.
   */
  async deletePayment(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Payment deletion is not supported by YooKassa"
    );
  }

  /**
   * Update a payment.
   * YooKassa не поддерживает прямое обновление платежей.
   */
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: input.data ?? {} };
  }

  /**
   * Process webhook event and map it to Medusa action.
   */
  async getWebhookActionAndData(data: Record<string, unknown>): Promise<WebhookActionResult> {
    const event = data.event as string;
    const paymentData = data.object as Record<string, unknown>;

    switch (event) {
      case "payment.succeeded":
        return { action: "captured", data: paymentData as WebhookActionData };
      case "payment.waiting_for_capture":
        return { action: "authorized", data: paymentData as WebhookActionData };
      case "payment.canceled":
        return { action: "canceled", data: paymentData as WebhookActionData };
      default:
        return { action: "not_supported", data: paymentData as WebhookActionData };
    }
  }

  /**
   * Helper to build and log errors with additional context.
   */
  protected createError(message: string, error: Error): Error {
    const errorDetails = ("raw" in error ? (error as any).raw : error) as object;
    return new Error(
      `${message}: ${error.message}. ${"detail" in errorDetails ? (errorDetails as any).detail : ""}`.trim()
    );
  }
}

export default YooKassaProvider;
