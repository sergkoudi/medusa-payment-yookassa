import {
  IConfirmationWithoutData,
} from "@a2seven/yoo-checkout"

export interface PaymentIntentOptions {
  confirmation?: IConfirmationWithoutData,
}

export const PaymentProviderKeys = {
  YOOKASSA: "yookassa",
}
