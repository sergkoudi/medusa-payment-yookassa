import {
  IWebHookEvent,
  Payment,
  Refund,
  ICreatePayment
} from "@a2seven/yoo-checkout"

export interface YookassaOptions {
  /**
   * The SHOP_ID of YooKassa
   */
  shopId: string,
  /**
   * The secret key of YooKassa
   */
  secretKey: string,
  /**
   * Use this flag to capture payment immediately (default is false)
   */
  capture?: boolean,
  /**
   * Set a default description on the payment if the context does not provide one
   */
  paymentDescription?: string
}

export interface PaymentOptions extends Partial<ICreatePayment> { }

export interface YookassaEvent {
  type: "notification",
  event: IWebHookEvent,
  object: Payment | Refund | object
}

export const PaymentProviderKeys = {
  YOOKASSA: "yookassa",
}