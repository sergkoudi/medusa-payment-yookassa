import { IAmount, 
  ICapturePayment, 
  IConfirmationType, 
  ICreatePayment, 
  ICreateRefund, 
  IPaymentMethodData,
  YooCheckout } from "@a2seven/yoo-checkout";
import { AbstractPaymentProvider, MedusaError, PaymentSessionStatus } from "@medusajs/framework/utils"
import { 
  AuthorizePaymentInput, 
  AuthorizePaymentOutput, 
  CancelPaymentInput, 
  CancelPaymentOutput, 
  CapturePaymentInput , 
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
import { create } from "domain";

type YooKassaOptions = {
  shopId: string;
  secretKey: string;
}

type HandledErrorType =
  | { retry: true; }
  | { retry: false; data: Error };

abstract class YooKassaProvider extends AbstractPaymentProvider<YooKassaOptions> {
  static identifier = "YooKassa"
  protected options_: YooKassaOptions;
  protected checkout_: YooCheckout;
  protected container: Record<string, unknown>

  constructor(
    container: Record<string , unknown>,
    options: YooKassaOptions
    ) {
    super(container, options)

    this.options_ = options
    this.container = container
    this.checkout_ = new YooCheckout({shopId: this.options_.shopId , secretKey: this.options_.secretKey})
  }
  
  static validateOptions(options: Record<any, any>) {
    if (!options.shopId || !options.secretKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "SHOP_ID and SECRET_KEY are required in the provider's options."
      )
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    const paymentId = input.data?.id as string
    const payload = input.data?.payload as ICapturePayment
    const idempotenceKey = input.context?.idempotency_key
    const newData = await this.checkout_.capturePayment(paymentId, payload, idempotenceKey)
    return {data: newData as unknown as Record<string, unknown>}
  }

  async getPaymentStatus({
    data,
  }: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const id = data?.id as string
    if (!id) {
      throw this.buildError(
        "No payment intent ID provided while getting payment status",
        new Error("No payment intent ID provided")
      )
    }

    const paymentIntent = await this.checkout_.getPayment(id)
    const dataResponse = paymentIntent as unknown as Record<string, unknown>

    switch (paymentIntent.status) {
      case "pending":
        return { status: PaymentSessionStatus.PENDING, data: dataResponse }
      case "canceled":
        return { status: PaymentSessionStatus.CANCELED, data: dataResponse }
      case "waiting_for_capture":
        return { status: PaymentSessionStatus.AUTHORIZED, data: dataResponse }
      case "succeeded":
        return { status: PaymentSessionStatus.CAPTURED, data: dataResponse }
      default:
        return { status: PaymentSessionStatus.PENDING, data: dataResponse }
    }
  }

  async initiatePayment({
    currency_code,
    amount,
    data,
    context,
  }: InitiatePaymentInput): Promise<InitiatePaymentOutput> {

    const createPayload = {
      amount: {
        value: amount as string,
        currency: currency_code
      },
      payment_method_data: data?.bank_card as IPaymentMethodData,
      confirmation: {
        type: data?.confirmation_type as IConfirmationType,
        return_url: data?.return_url as string
      },
      ...data,
    }

    const responce  = await this.checkout_.createPayment(
        createPayload,
        context?.idempotency_key,
      )
    const isPaymentIntent = 'id' in responce;
    return {
      id: isPaymentIntent ? responce.id : (data?.session_id as string),
      data: responce as unknown as Record<string, unknown>,
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const statusResponce = await this.getPaymentStatus(input)

    return statusResponce
  }
  protected buildError(message: string, error: Error): Error {
    const errorDetails = ("raw" in error ? (error.raw) : error) as object

    return new Error(
      `${message}: ${error.message}. ${
        "detail" in errorDetails ? errorDetails.detail : ""
      }`.trim()
    )
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    const paymentId = input.data?.id as string
    const idempotenceKey = input.context?.idempotency_key

    const paymentData = await this.checkout_.cancelPayment(paymentId , idempotenceKey)
    return { data: paymentData as unknown as Record<string , unknown>}
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    try {
      const payment = await this.checkout_.getPayment(input.data?.id as string);
      return payment as unknown as Record<string, unknown>;
    } catch (error) {
      throw this.buildError("Failed to retrieve payment", error as Error);
    }
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const paymentId = input.data?.id as string;
    const amount = input.amount as IBigNumber;
    
    const refundPayload: ICreateRefund = {
      payment_id: paymentId,
      amount: {
        value: amount.toString(),
        currency: input.data?.currency_code as string
      }
    };

    try {
      const refund = await this.checkout_.createRefund(
        refundPayload, 
        input.context?.idempotency_key
      );
      
      return { 
        data: refund as unknown as Record<string, unknown> 
      };
    } catch (error) {
      throw this.buildError("Refund failed", error as Error);
    }
  }

  async deletePayment(
    input: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Payment deletion is not supported by YooKassa"
    );
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    // YooKassa не поддерживает прямое обновление платежей
    return { 
      data: input.data || {} 
    };
  }

  async getWebhookActionAndData(
    data: Record<string, unknown>
  ): Promise<WebhookActionResult> {
    const event = data.event as string;
    const paymentData = data.object as Record<string, unknown>;

    switch (event) {
      case "payment.succeeded":
        return {
          action: "captured",
          data: paymentData as unknown as WebhookActionData
        };
      case "payment.waiting_for_capture":
        return {
          action: "authorized",
          data: paymentData as unknown as WebhookActionData
        };
      case "payment.canceled":
        return {
          action: "canceled",
          data: paymentData as unknown as WebhookActionData
        };
      default:
        return { 
          action: "not_supported", 
          data: paymentData as unknown as WebhookActionData
        };
    }
  }

}

export default YooKassaProvider