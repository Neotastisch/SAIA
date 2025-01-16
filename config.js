require('dotenv').config();

module.exports = {
    openrouter: {
        key: process.env.OPEN_ROUTER_API_KEY
    },
    shopify: {
        shopName: process.env.SHOPIFY_SHOP_NAME,
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
        apiVersion: process.env.SHOPIFY_API_VERSION
    },
    server: {
        port: process.env.PORT || 3000
    }
};