export type { MasterSheet, IndentSheet, ReceivedSheet, Sheet, allPermissionKeys, Vendor, UserPermissions, InventorySheet, IssueSheet, StoreInSheet , TallyEntrySheet , PcReportSheet , FullkittingSheet ,PaymentHistory,PIApprovalSheet} from "./sheets";
export { type ProductFormValues,type ProductItemProps, type Options,type  FormValues, formSchema } from "./indentForm";
export { type RouteAttributes } from "./routes";
export type PoMasterSheet = {
    rowIndex?: number;
    timestamp: string;
    partyName: string;
    poNumber: string;
    internalCode: string;
    product: string;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    gst: number;
    discount: number;
    amount: number;
    totalPoAmount: number;
    pdf: string;
    preparedBy?: string;
    approvedBy?: string;
    quotationNumber: string;
    quotationDate: string;
    enquiryNumber: string;
    enquiryDate: string;
    deliveryDate?: string;
    paymentTerms?: string;
    numberOfDays?: number;
    discountPercent?: number;
    gstPercent?: number;
    term1: string;
    term2: string;
    term3: string;
    term4: string;
    term5: string;
    term6: string;
    term7: string;
    term8: string;
    term9: string;
    term10: string;
    deliveryDays: number;
    deliveryType: string;
    firmNameMatch: string;
    emailSendStatus?: string;
    
    // ✅ CORRECT: Match exact Google Sheet column names
    'Guarantee'?: string;
    'Freight Payment'?: string;
    
    // Optional: PI Approval fields
    piApprovalTimestamp?: string;
    piQty?: number;
    piAmount?: number;
    piCopy?: string;
    poRateWithoutTax?: number;
};
