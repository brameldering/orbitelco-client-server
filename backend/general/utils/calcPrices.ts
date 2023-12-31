import { ITotalAmounts } from 'types/commonTypes';
import { OrderOrderItem } from 'types/mongoose.gen';

export const roundTo2Decimals = (num: number) => {
  return Math.round(num * 100) / 100;
};

export const calcPrices = (items: OrderOrderItem[]): ITotalAmounts => {
  const VAT_FRACTION: number = Number(
    process.env.VAT_PERCENTAGE && Number(process.env.VAT_PERCENTAGE) / 100
  );
  const SHIPPING_FEE: number = Number(process.env.SHIPPING_FEE);
  const THRESHOLD_FREE_SHIPPING: number = Number(
    process.env.THRESHOLD_FREE_SHIPPING
  );
  // Calculate the total items price
  const itemsPrice = roundTo2Decimals(
    items.reduce(
      (acc: number, item: OrderOrderItem) => acc + item.price * item.qty,
      0
    )
  );
  const shippingPrice = roundTo2Decimals(
    items.length === 0 || itemsPrice > THRESHOLD_FREE_SHIPPING
      ? 0
      : SHIPPING_FEE
  );
  const taxPrice = roundTo2Decimals(VAT_FRACTION * itemsPrice);
  const totalPrice = roundTo2Decimals(itemsPrice + shippingPrice + taxPrice);
  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
};
