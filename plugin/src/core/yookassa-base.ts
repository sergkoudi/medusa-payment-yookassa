import {
  ICapturePayment,
  IConfirmationType,
  ICreatePayment,
  YooCheckout,
} from "@a2seven/yoo-checkout"
import {
  AbstractPaymentProvider,
  PaymentSessionStatus,
  isDefined
} from "@medusajs/framework/utils"
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
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
} from "@medusajs/framework/types"
import {
  YooKassaOptions,
  PaymentOptions
} from "../types"

export abstract class YooKassaProvider extends AbstractPaymentProvider<YooKassaOptions> {
  protected readonly options_: YooKassaOptions
  protected yooCheckout_: YooCheckout
  protected container_: Record<string, unknown>

  static validateOptions(options: YooKassaOptions): void {
    if (!isDefined(options.shopId)) {
      throw new Error("Required option `shopId` is missing in YooKassa plugin")
    }
    if (!isDefined(options.secretKey)) {
      throw new Error("Required option `secretKey` is missing in YooKassa plugin")
    }
  }

  constructor(container: Record<string, unknown>, options: YooKassaOptions) {
    // @ts-ignore
    super(...arguments)

    this.options_ = options
    this.container_ = container
    this.yooCheckout_ = new YooCheckout({
      shopId: options.shopId,
      secretKey: options.secretKey,
    })
  }

  abstract get paymentOptions(): PaymentOptions

  get options(): YooKassaOptions {
    return this.options_
  }
  
  /**
   * Capture an existing payment.
   */
  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const paymentId = input.data?.id as string
    const payload = input.data?.payload as ICapturePayment
    const idempotencyKey = input.context?.idempotency_key

    try {
      const response = await this.yooCheckout_.capturePayment(paymentId, payload, idempotencyKey)
      return { data: response as unknown as Record<string, unknown> }
    } catch (e) {
      throw this.buildError("An error occurred in capturePayment", e)
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
        currency: currency_code.toUpperCase(), // TODO: convert to ISO-4217 instead
      },
      "payment_method_data": {
        "type": "bank_card"
      },
      capture: this.options_.capture,
      confirmation: {
        type: this.paymentOptions?.confirmation?.type as IConfirmationType,
        return_url: data?.return_url as string,
      },
      description: ""
    }

    try {
      const response = await this.yooCheckout_.createPayment(createPayload, context?.idempotency_key)
      console.log('response ---', response)
      // Если объект содержит id, считаем его платежным намерением
      const paymentId = "id" in response ? response.id : (data?.session_id as string)
      return {
        id: paymentId,
        data: response as unknown as Record<string, unknown>,
      }
    } catch (e) {
      throw this.buildError("An error occurred in initiatePayment", e)
    }
  }

  /**
   * Retrieve payment status and map it to Medusa status.
   */
  async getPaymentStatus({
    data
  }: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const id = data?.id as string
    if (!id) {
      throw this.buildError(
        "No payment ID provided while getting payment status",
        new Error("No payment intent ID provided")
      )
    }

    try {
      const payment = await this.yooCheckout_.getPayment(id)
      const paymentData = payment as unknown as Record<string, unknown>

      switch (payment.status) {
        case "pending":
          return { status: PaymentSessionStatus.REQUIRES_MORE, data: paymentData }
        case "canceled":
          return { status: PaymentSessionStatus.CANCELED, data: paymentData }
        case "waiting_for_capture":
          return { status: PaymentSessionStatus.AUTHORIZED, data: paymentData }
        case "succeeded":
          return { status: PaymentSessionStatus.CAPTURED, data: paymentData }
        default:
          return { status: PaymentSessionStatus.PENDING, data: paymentData }
      }
    } catch (e) {
      throw this.buildError("An error occurred in refundPayment", e)
    }
  }


  /**
   * Authorize a payment by retrieving its status.
   */
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    console.log("authorizePayment", input)
    const statusResponse = await this.getPaymentStatus(input)
    return statusResponse
  }

  /**
   * Cancel an existing payment.
   */
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    console.log("cancelPayment", input)
    const paymentId = input.data?.id as string
    const idempotencyKey = input.context?.idempotency_key

    try {
      const response = await this.yooCheckout_.cancelPayment(paymentId, idempotencyKey)
      return { data: response as unknown as Record<string, unknown> }
    } catch (e) {
      throw this.buildError("An error occurred in cancelPayment", e)
    }
  }

  /**
   * Retrieve a payment by ID.
   */
  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    console.log("retrievePayment", input)
    try {
      const payment = await this.yooCheckout_.getPayment(input.data?.id as string)
      return payment as unknown as Record<string, unknown>
    } catch (e) {
      throw this.buildError("An error occurred in retrievePayment", e)
    }
  }

  /**
   * Refund a payment.
   */
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    console.log("refundPayment", input)

    const paymentId = input.data?.id as string
    const amount = input.amount as IBigNumber
    const refundPayload = {
      payment_id: paymentId,
      amount: {
        value: amount.toString(),
        currency: input.data?.currency_code as string,
      },
    }

    try {
      const refund = await this.yooCheckout_.createRefund(refundPayload, input.context?.idempotency_key)
      return { data: refund as unknown as Record<string, unknown> }
    } catch (e) {
      throw this.buildError("An error occurred in refundPayment", e)
    }
  }

  /**
   * Delete a payment.
   * Payment deletion is not supported by YooKassa.
   */
  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return input
  }

  /**
   * Update a payment.
   * Payment update is not supported by YooKassa.
   */
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return input
  }

  /**
   * Process webhook event and map it to Medusa action.
   */
  async getWebhookActionAndData(data: Record<string, unknown>): Promise<WebhookActionResult> {
    console.log("getWebhookActionAndData", data)

    const event = data.event as string
    const paymentData = data.object as Record<string, unknown>

    switch (event) {
      case "payment.succeeded":
        return { action: "captured", data: paymentData as WebhookActionData }
      case "payment.waiting_for_capture":
        return { action: "authorized", data: paymentData as WebhookActionData }
      case "payment.canceled":
        return { action: "canceled", data: paymentData as WebhookActionData }
      default:
        return { action: "not_supported", data: paymentData as WebhookActionData }
    }
  }

  /**
   * Helper to build errors with additional context.
   */
  protected buildError(message: string, error: Error): Error {
    const errorDetails =
      "raw" in error ? (error.raw as any) : error

    return new Error(
      `${message}: ${error.message}. ${"detail" in errorDetails ? errorDetails.detail : ""}`.trim()
    )
  }
}

export default YooKassaProvider
