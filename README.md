# Missive Stripe Proxy Cloudflare Worker

This is a Cloudflare Worker that acts as a secure proxy to the Stripe API. It is designed to be used with [Missive's](https://missiveapp.com/) custom integrations, allowing you to securely make Stripe API calls from within Missive.

## Features

- **Stripe API Proxy**: Forwards requests to the Stripe API.
- **Secure**: Uses a restricted Stripe API key and validates a security header to protect the endpoint.
- **CORS Handling**: Handles CORS preflight requests, allowing it to be called from any client-side application.

## Deployment

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd extendkit-missive-stripe-proxy
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Configure `wrangler.toml`:**
    You need to add the following environment variables to your `wrangler.toml` file.

    ```toml
    [vars]
    # Your Stripe restricted API key (must start with rk_)
    STRIPE_API_KEY = "rk_..."

    # Custom header name for security
    SECURITY_HEADER_NAME = "X-Custom-Auth"

    # The value for the custom security header
    SECURITY_HEADER_VALUE = "your-secret-value"
    ```

4.  **Deploy the worker:**
    ```sh
    npx wrangler deploy
    ```

## Usage

Once deployed, you can make requests to your worker's URL. The worker will forward the requests to the Stripe API.

Example using `curl`:

```sh
curl -X GET "https://<your-worker-url>/v1/customers" \
  -H "Content-Type: application/json" \
  -H "X-Custom-Auth: your-secret-value"
```

Replace `<your-worker-url>` with the URL of your deployed worker.