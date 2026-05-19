import fetch from "node-fetch";

async function run() {
  const response = await fetch("https://sandbox.cashfree.com/pg/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": "2023-08-01",
      "x-client-id": "dummy",
      "x-client-secret": "dummy"
    },
    body: JSON.stringify({
      order_amount: 10,
      order_currency: "INR",
      customer_details: {
        customer_id: "cust_123",
        customer_phone: "9999999999"
      }
    })
  });
  console.log(response.status);
  console.log(await response.text());
}
run();
