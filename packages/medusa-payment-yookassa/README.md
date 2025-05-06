
# YooKassa Payments for Medusa

A Medusa plugin that provides YooKassa (aka YooMoney) payments.

## Prerequisites

- Medusa server v2.7.0 or later
- Node.js v20 or later
- A [YooKassa](https://yookassa.ru/joinups/?source=ks) account, a shop identifier `shopId` and a secret API key `secretKey`.

## Installation

```bash
yarn add medusa-payment-yookassa
# or
npm install medusa-payment-yookassa
```

## Configuration

Add the provider configuration in your `medusa-config.js` file of the Medusa admin application:

```js
# ...
module.exports = defineConfig({
  # ...
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "medusa-payment-yookassa/providers/payment-yookassa",
            id: "yookassa",
            options: {
              shopId: process.env.YOOKASSA_SHOP_ID,
              secretKey: process.env.YOOKASSA_SECRET_KEY,
              capture: true,
              paymentDescription: "Test payment"
            },
          }
        ]
      }
    }
  ]
})
```

Add environment variables:

```
YOOKASSA_SHOP_ID=1234567
YOOKASSA_SECRET_KEY=live_secret_api_key
```

Then, set up a webhook URL for notifications from YooKassa [here](https://yookassa.ru/my/merchant/integration/http-notifications). The URL should be in the following format:

```
https://{YOUR_MEDUSA_DOMAIN}/hooks/payment/yookassa_yookassa
```

## Storefront Integration

Make the necessary changes to your Medusa storefront.
You can refer to the modifications made in the [Medusa Next.js Starter Template](https://github.com/medusajs/nextjs-starter-medusa), which are located in the [`examples/medusa-storefront`](https://github.com/sergkudinov/medusa-payment-yookassa/tree/main/examples/medusa-storefront) directory.
To see the exact differences, check the [comparison page](https://github.com/sergkudinov/medusa-payment-yookassa/compare/v0.0.0...main).

## Development

Find documentation on bootstrapping a development environment [here](https://github.com/sergkudinov/medusa-payment-yookassa/tree/main/examples).

## References

- [API YooKassa](https://yookassa.ru/developers)

## License

Licensed under the [MIT License](LICENSE).