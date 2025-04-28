import YooKassaProvider from "../core/yookassa-base"
import { PaymentOptions, PaymentProviderKeys } from "../types"
import { 
  ModuleProvider, 
  Modules
} from "@medusajs/framework/utils"

export class YooKassaService extends YooKassaProvider {
    static identifier = PaymentProviderKeys.YOOKASSA
  
    constructor(_, options) {
      super(_, options)
    }
  
    get paymentOptions(): PaymentOptions{
      return {
        confirmation: {
          type: "redirect",
        },
      }
    }
  }

export default ModuleProvider(Modules.PAYMENT, {
  services: [YooKassaService],
})