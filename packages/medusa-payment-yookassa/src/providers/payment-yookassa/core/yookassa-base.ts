import {
  YooCheckout,
  ICapturePayment,
  IConfirmationWithoutData,
  ICreatePayment,
  ICreateRefund,
  PaymentStatuses,
  Payment,
  Refund,
  WebHookEvents
} from "@a2seven/yoo-checkout"
import axios, { AxiosError } from "axios"
import {
  AbstractPaymentProvider,
  PaymentSessionStatus,
  PaymentActions,
  BigNumber,
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
  ProviderWebhookPayload,
  WebhookActionResult,
  RefundPaymentInput,
  RefundPaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  RetrievePaymentOutput,
  RetrievePaymentInput
} from "@medusajs/framework/types"

import {
  PaymentOptions,
  YookassaOptions,
  YookassaEvent
} from "../types"


abstract class YookassaBase extends AbstractPaymentProvider<YookassaOptions> {
  protected readonly options_: YookassaOptions
  protected yooCheckout_: YooCheckout
  protected container_: Record<string, unknown>

  static validateOptions(options: YookassaOptions): void {
    if (!isDefined(options.shopId)) {
      throw new Error("Required option `shopId` is missing in YooKassa plugin")
    }
    if (!isDefined(options.secretKey)) {
      throw new Error("Required option `secretKey` is missing in YooKassa plugin")
    }
  }

  protected constructor(container: Record<string, unknown>, options: YookassaOptions) {
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

  get options(): YookassaOptions {
    return this.options_
  }

  private normalizePaymentParameters(
    extra?: Record<string, unknown>
  ): Partial<ICreatePayment> {
    const res = {} as Partial<ICreatePayment>

    res.description =
      extra?.description as string ??
      this.options_?.paymentDescription

    res.capture =
      extra?.capture as boolean ??
      this.paymentOptions.capture ??
      this.options_.capture

    res.payment_method_data = this.paymentOptions?.payment_method_data

    res.confirmation = extra?.confirmation as IConfirmationWithoutData | undefined

    return res
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
    console.log("initiatePayment data", data)
    const additionalParameters = this.normalizePaymentParameters(data)

    const createPayload: ICreatePayment = {
      amount: {
        value: amount as string,
        currency: currency_code.toUpperCase(), // Medusa stores currency codes in lower case of ISO-4217
      },
      metadata: {
        session_id: data?.session_id as string
      },
      ...additionalParameters
    }

    try {
      const response = await this.yooCheckout_.createPayment(createPayload, context?.idempotency_key)
      console.log("response", response)
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
    console.log("getPaymentStatus", data)
    const id = data?.id as string
    if (!id) {
      throw this.buildError(
        "No payment ID provided while getting payment status",
        new Error("No payment ID provided")
      )
    }

    try {
      const payment = await this.yooCheckout_.getPayment(id)
      const paymentData = payment as unknown as Record<string, unknown>

      switch (payment.status) {
        case PaymentStatuses.pending:
          return { status: PaymentSessionStatus.PENDING, data: paymentData }
        case PaymentStatuses.canceled:
          return { status: PaymentSessionStatus.CANCELED, data: paymentData }
        case PaymentStatuses.waiting_for_capture:
          return { status: PaymentSessionStatus.AUTHORIZED, data: paymentData }
        case PaymentStatuses.succeeded:
          return { status: PaymentSessionStatus.CAPTURED, data: paymentData }
        default:
          return { status: PaymentSessionStatus.PENDING, data: paymentData }
      }
    } catch (e) {
      throw this.buildError("An error occurred in getPaymentStatus", e)
    }
  }

  /**
   * Capture an existing payment.
   */
  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    console.log("capturePayment", input)
    const payment = input.data as unknown as Payment

    // Avoid autoCapture in https://github.com/medusajs/medusa/blob/ceb504db2ce44dec43dff652fb306eb4e4f6059e/packages/modules/payment/src/services/payment-module.ts#L590
    if (payment.status === PaymentStatuses.succeeded)
      return { data: input }

    const payload: ICapturePayment = {
      amount: payment.amount
    }
    const idempotencyKey = input.context?.idempotency_key
    try {
      const response = await this.yooCheckout_.capturePayment(payment.id, payload, idempotencyKey)
      return { data: response as unknown as Record<string, unknown> }
    } catch (e) {
      throw this.buildError("An error occurred in capturePayment", e)
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
   * Retrieve a payment.
   */
  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    console.log("retrievePayment", input)
    try {
      const payment = await this.yooCheckout_.getPayment(input.data?.id as string)
      return { data: payment as unknown as Record<string, unknown> }
    } catch (e) {
      throw this.buildError("An error occurred in retrievePayment", e)
    }
  }

  /**
   * Refund a payment.
   */
  async refundPayment({
    amount,
    data,
    context,
  }: RefundPaymentInput): Promise<RefundPaymentOutput> {
    console.log("refundPayment", {amount, data, context})
    const payment = data as unknown as Payment
    const id = payment?.id
    if (!id) {
      throw this.buildError(
        "No payment ID provided while refunding payment",
        new Error("No payment ID provided")
      )
    }

    const payload: ICreateRefund = {
      payment_id: id,
      amount: {
        value: new BigNumber(amount).numeric.toString(),
        currency: payment?.amount?.currency,
      },
    }

    try {
      await this.yooCheckout_.createRefund(payload, context?.idempotency_key)
      return await this.retrievePayment({data})
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
  async getWebhookActionAndData(webhookData: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    console.log("webhookData", webhookData)
    console.log("webhookData.data.object", webhookData.data.object)
    const isValid = await this.isWebhookEventValid(webhookData)
    if (!isValid)
      return {
        action: PaymentActions.NOT_SUPPORTED
      }

    const { event, object } = webhookData.data as unknown as YookassaEvent

    switch (event) {
      case WebHookEvents["payment.succeeded"]:
        return {
          action: PaymentActions.SUCCESSFUL,
          data: {
            session_id: (object as Payment).metadata.session_id,
            amount: (object as Payment).amount.value,
          }
        }
      case WebHookEvents["payment.waiting_for_capture"]:
        return {
          action: PaymentActions.AUTHORIZED,
          data: {
            session_id: (object as Payment).metadata.session_id,
            amount: (object as Payment).amount.value,
          },
        }
      case WebHookEvents["payment.canceled"]:
        return {
          action: PaymentActions.CANCELED,
          data: {
            session_id: (object as Payment).metadata.session_id,
            amount: (object as Payment).amount.value,
          },
        }
      default:
        return {
          action: PaymentActions.NOT_SUPPORTED
        }
    }
  }

  /**
   * Validate Webhook event
   * @param {object} webhookData - the data of the webhook request: req.body
   * @returns {boolean} - stutus of validation
   */
  protected async isWebhookEventValid(webhookData: ProviderWebhookPayload["payload"]): Promise<boolean> {
    const [object, status] = (webhookData.data.event as YookassaEvent["event"]).split('.');
    try {
      switch (object) {
        case "payment":
          const payment = await this.yooCheckout_.getPayment((webhookData.data.object as Payment).id)
          return payment.status === status
        case "refund":
          const refund = await this.yooCheckout_.getRefund((webhookData.data.object as Refund).id)
          return refund.status === status
        default:
          return false
      }
    } catch (e) {
      throw this.buildError(`An error occurred in isWebhookEventValid when validating a ${object}`, e)
    }
  }

  /**
   * Helper to build errors with additional context.
   */
  protected buildError(message: string, error: Error | AxiosError): Error {
    if (axios.isAxiosError(error)) {
      return new Error(
        `${message}: ${error.response?.status} ${error.response?.data?.code} - ${error.response?.data?.description}`.trim()
      )
    }
    return new Error(
      `${message}: ${error.message}`.trim()
    )
  }
}

export default YookassaBase
