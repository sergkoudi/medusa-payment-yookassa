import {
  IConfirmationWithoutData,
} from "@a2seven/yoo-checkout"

export interface YooKassaOptions {
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
  capture?: boolean
  /**
   * Set a default description on the intent if the context does not provide one
   */
  paymentDescription?: string
}

export interface PaymentOptions {
  confirmation?: IConfirmationWithoutData,
}

export const PaymentProviderKeys = {
  YOOKASSA: "yookassa",
}