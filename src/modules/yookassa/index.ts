import YooKassaProvider from "../../core/yookassa-base"
import { 
  ModuleProvider, 
  Modules
} from "@medusajs/framework/utils"

class YooKassaService extends YooKassaProvider {
    static identifier = 'YooKassa'
  
    constructor(_, options) {
      super(_, options)
    }
  
    get paymentIntentOptions(){
      return {}
    }
  }

export default ModuleProvider(Modules.PAYMENT, {
  services: [YooKassaService],
})