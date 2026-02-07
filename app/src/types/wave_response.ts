export type RolePermission =
  | "MANAGE_STATIC_QR_COLLECTIONS"
  | "FUND_BUSINESS"
  | "TAKE_PAYMENTS"
  | "MANAGE_BILL_PAYMENTS"
  | "SEND_B2B_PAYMENTS"
  | "SEND_BULK_PAYMENTS"
  | "FUND_SUB_ACCOUNTS"
  | "CREATE_B2B_PAYMENTS"
  | "MANAGE_API_KEYS"
  | "REQUEST_SETTLEMENT"
  | "MANAGE_BUSINESS_SEARCH_REQUEST_URLS"
  | "LOGIN_BUSINESS_PORTAL"
  | "CANCEL_BULK_PAYMENTS"
  | "REFUND_ALL_MERCHANT_PAYMENTS"
  | "CREATE_SINGLE_PAYMENTS"
  | "SEARCH_WALLET_TRANSACTIONS"
  | "VIEW_WEBHOOKS"
  | "VIEW_BULK_PAYMENTS"
  | "VIEW_WALLET_BALANCE"
  | "DEPOSIT"
  | "MANAGE_WEBHOOKS"
  | "SEND_SINGLE_PAYMENTS"
  | "VIEW_ALL_WALLET_TRANSACTIONS"
  | "CREATE_BULK_PAYMENTS"
  | "APPROVE_BULK_PAYMENTS"
  | "MANAGE_BUSINESS_USERS"
  | "VIEW_ALL_SUPERVISED_WALLET_TRANSACTIONS"
  | "LOGIN_BUSINESS_APP"
  | "DOWNLOAD_REPORTS"
  | "WITHDRAW_AT_AGENT"
  | "VIEW_BUSINESS_USERS";

export type ActionSource = "PAYMENT_LINK" | string;

export type FormatType = "DateTime" | null;

export type BaseReceiptFieldLabel =
  | "Net Amount"
  | "Wave Fee Amount"
  | "Status"
  | "Date & time"
  | "Customer"
  | "Transaction ID"
  | "Merchant"
  | string;

export interface BaseReceiptField {
  formatType: FormatType;
  label: BaseReceiptFieldLabel;
  value: string;
}

export interface CustomField {
  [key: string]: unknown;
}

export interface MerchantSaleEntry {
  __typename: "MerchantSaleEntry";
  id: string;
  summary: string;
  whenEntered: string;
  amount: string;
  isPending: boolean;
  isCancelled: boolean;
  baseReceiptFields: BaseReceiptField[];
  businessSurrogate: string | null;
  isRefunded: boolean;
  isCheckout: boolean;
  clientReference: string | null;
  transferId: string;
  customerMobile: string;
  customerName: string;
  cashierName: string;
  grossAmount: string;
  feeAmount: string;
  actionSource: ActionSource;
  overrideBusinessName: string | null;
  customFields: CustomField[];
}

export interface MerchantSweepSentEntry {
  __typename: "MerchantSweepSentEntry";
  id: string;
  summary: string;
  whenEntered: string;
  amount: string;
  isPending: boolean;
  isCancelled: boolean;
  baseReceiptFields: BaseReceiptField[];
  businessSurrogate: string | null;
  sweepGrossVolume: string | null;
}

export type HistoryEntry = MerchantSaleEntry | MerchantSweepSentEntry;

export interface Batch {
  [key: string]: unknown;
}

export interface WalletHistory {
  batches: Batch[];
  historyEntries: HistoryEntry[];
}

export interface Business {
  name: string;
  showGrossAmount: boolean;
  showSurrogateOptions: boolean;
  walletHistory: WalletHistory;
  id: string;
}

export interface UserMerchant {
  needsPinToRefund: boolean;
  id: string;
}

export interface User {
  merchant: UserMerchant;
  id: string;
}

export interface BusinessUser {
  rolePermissions: RolePermission[];
  user: User;
  business: Business;
  id: string;
}

export interface Merchant {
  canRefund: boolean;
  name: string;
  id: string;
}

export interface Me {
  merchant: Merchant;
  businessUser: BusinessUser;
  id: string;
}

export interface Data {
  me: Me;
}

export interface WaveApiResponse {
  data: Data;
}