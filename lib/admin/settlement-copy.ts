import type { SettlementDocumentCopy } from '@/components/settlements/settlement-document'

/**
 * The settlement sheet's wording on the admin side.
 *
 * The console is English-only by convention while the seller console is
 * translated, so the shared document takes its strings as a prop. This is the
 * admin half; the seller half is `t.wholesale.document`. Keeping them in step
 * is what lets both parties print the same figures under the same headings.
 */
export const ADMIN_DOCUMENT_COPY: SettlementDocumentCopy = {
  title: 'Settlement statement',
  lotTitle: 'Settlement statement — period',
  settlementNo: 'Settlement',
  orderNo: 'Order',
  issued: 'Issued',
  delivered: 'Delivered',
  period: 'Period',
  fromParty: 'From',
  toParty: 'To',
  storeName: 'The store',
  colItem: 'Item',
  colQty: 'Qty',
  colUnit: 'Unit',
  colValue: 'Value',
  colRate: 'Comm %',
  colCommission: 'Commission',
  colPayout: 'Payout',
  colOrder: 'Order',
  colDelivered: 'Delivered',
  goodsValue: 'Goods value',
  commission: 'Store commission',
  payableToShop: 'Payable to {shop}',
  retainedByStore: 'Retained by the store',
  paidStamp: 'PAID',
  unpaidStamp: 'UNPAID',
  voidStamp: 'CANCELLED',
  pendingStamp: 'NOT YET DELIVERED',
  paidOn: 'Paid {date}',
  reference: 'Reference',
  settlementCount: '{n} settlements',
  footerNote:
    'Delivery charges and any store discount are the store’s own and are not deducted from this payout.',
}
