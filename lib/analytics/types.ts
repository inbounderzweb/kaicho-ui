export type EcommerceItem = {
  item_id: string;
  item_name: string;
  price: number;
  currency: string;
  quantity?: number;
  item_category?: string;
};

/**
 * Standard GA4-shaped ecommerce/engagement event contract. This is the
 * typed vocabulary the whole app uses — see `trackEvent` in `./events`.
 *
 * Events like `add_to_cart`, `purchase`, `login` etc. are DEFINED here so
 * the contract exists and is documented, but nothing in the app currently
 * calls them — there is no real cart/checkout/auth yet. Wire a case up only
 * when the corresponding feature is real; firing these against fake state
 * would corrupt conversion data later. See README "Future Architecture".
 */
export type StandardEvent =
  | { name: "page_view"; params: { page_path: string; page_title?: string } }
  | { name: "view_item_list"; params: { item_list_name: string; items: EcommerceItem[] } }
  | { name: "select_item"; params: { item_list_name: string; items: EcommerceItem[] } }
  | { name: "view_item"; params: { currency: string; value: number; items: EcommerceItem[] } }
  | { name: "search"; params: { search_term: string } }
  | { name: "add_to_cart"; params: { currency: string; value: number; items: EcommerceItem[] } }
  | { name: "remove_from_cart"; params: { currency: string; value: number; items: EcommerceItem[] } }
  | { name: "view_cart"; params: { currency: string; value: number; items: EcommerceItem[] } }
  | { name: "begin_checkout"; params: { currency: string; value: number; items: EcommerceItem[] } }
  | { name: "add_shipping_info"; params: { currency: string; value: number; items: EcommerceItem[] } }
  | { name: "add_payment_info"; params: { currency: string; value: number; items: EcommerceItem[] } }
  | {
      name: "purchase";
      params: { transaction_id: string; currency: string; value: number; items: EcommerceItem[] };
    }
  | { name: "login"; params: { method?: string } }
  | { name: "sign_up"; params: { method?: string } }
  | { name: "add_to_wishlist"; params: { currency: string; value: number; items: EcommerceItem[] } };

export type StandardEventName = StandardEvent["name"];
