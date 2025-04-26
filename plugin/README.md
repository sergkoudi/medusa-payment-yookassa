
# `medusa-payment-yookassa` plugin

A Medusa plugin that provides YooKassa payment.

Work in progress...

## Installation

```bash
yarn add medusa-payment-yookassa
# or
npm install medusa-payment-yookassa
```

## Usage

In your Medusa admin project `medusa-config.js`:

```bash
...
modules: [
    ...
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "medusa-payment-yookassa",
            id: "yookassa",
            options: {
              shopId: process.env.YOOKASSA_SHOP_ID,
              secretKey: process.env.YOOKASSA_SECRET_KEY
            },
          }
        ],
      },
    },
    ...
]
...
```

Make changes in your Medusa storefront:

```
# Instructions will come later...
```

## References

- [API YooKassa](https://yookassa.ru/developers)