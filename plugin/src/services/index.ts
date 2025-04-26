import YooKassaProvider from "../core/yookassa-base"
import { PaymentIntentOptions, PaymentProviderKeys } from "../types"
import { 
  ModuleProvider, 
  Modules
} from "@medusajs/framework/utils"

export class YooKassaService extends YooKassaProvider {
    static identifier = PaymentProviderKeys.YOOKASSA
  
    constructor(_, options) {
      super(_, options)
    }
  
    get paymentIntentOptions(): PaymentIntentOptions{
      return {
        confirmation: {
          type: "redirect",
          return_url: "http://localhost:8000/"
        },
      }
    }
  }

export default ModuleProvider(Modules.PAYMENT, {
  services: [YooKassaService],
})