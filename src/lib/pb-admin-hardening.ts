// Orders
const ORDERS_RULES = {
  listRule: "@request.auth.role = 'ADMIN'",
  viewRule: "@request.auth.role = 'ADMIN' || @request.auth.id = user",
  createRule: "@request.auth.role = 'ADMIN' || @request.auth.id = user",
  updateRule: "@request.auth.role = 'ADMIN'",
  deleteRule: "@request.auth.role = 'ADMIN'"
};

// Exchange rates
const EXCHANGE_RULES = {
  listRule: "@request.auth.role = 'ADMIN'",
  viewRule: "@request.auth.role = 'ADMIN'",
  createRule: "@request.auth.role = 'ADMIN'",
  updateRule: "@request.auth.role = 'ADMIN'",
  deleteRule: "@request.auth.role = 'ADMIN'"
};

// Order status events
const ORDER_STATUS_EVENTS_RULES = {
  listRule: "@request.auth.role = 'ADMIN' || @request.auth.id = order.user",
  viewRule: "@request.auth.role = 'ADMIN' || @request.auth.id = order.user",
  createRule: "@request.auth.role = 'ADMIN'",
  updateRule: "@request.auth.role = 'ADMIN'",
  deleteRule: "@request.auth.role = 'ADMIN'"
};

// Aplicar reglas (ejecutar una vez)
export async function applyHardeningRules(pb: any) {
  await pb.collection("orders").updateRules(ORDERS_RULES);
  await pb.collection("exchange_rates").updateRules(EXCHANGE_RULES);
  await pb.collection("order_status_events").updateRules(ORDER_STATUS_EVENTS_RULES);
}
