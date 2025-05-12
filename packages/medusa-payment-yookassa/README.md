<p align="center">
  <a href="https://www.medusajs.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
      <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg" height="50">
    </picture>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://yookassa.ru">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/8269a9c9-53ab-4c55-ad6c-72bbaa334e20">
      <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/25d8717e-8b81-4584-902b-6b921afd3f92">
      <img alt="YooKassa logo" src="https://github.com/user-attachments/assets/25d8717e-8b81-4584-902b-6b921afd3f92" height="50">
    </picture>
  </a>
</p>

<h1 align="center">
YooKassa Payments for Medusa
</h1>

<p align="center">
A Medusa plugin that provides YooKassa (aka YooMoney) payments.
</p>
<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/develop/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/Telegram-Join%20Medusa%20Community%20Chat-0088cc?logo=telegram&logoColor=white" alt="Join on Telegram" />
  </a>
</p>

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

## 💬 Support & Community on Telegram

Join the [Medusa Telegram community chat](https://t.me/medusajs_com) to discuss features, get support, and connect with developers building on Medusa.

## License

Licensed under the [MIT License](LICENSE).