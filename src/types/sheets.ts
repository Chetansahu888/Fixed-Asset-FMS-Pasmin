export type Sheet = 
    | 'INDENT' 
    | 'RECEIVED' 
    | 'MASTER' 
    | 'USER' 
    | 'PO MASTER' 
    | 'INVENTORY' 
    | 'ISSUE' 
    | 'STORE IN' 
    | 'TALLY ENTRY' 
    | 'PC REPORT' 
    | 'Fullkitting' 
    | 'Payment History' 
    | 'PI APPROVAL';  // ✅ Already included

export type IndentSheet = {
    issuedStatus: any;
    timestamp: string;
    indentNumber: string;
    firmName: string;
    indenterName: string;
    department: string;
    areaOfUse: string;
    groupHead: string;
    productName: string;
    quantity: number;
    uom: string;
    specifications: string;
    indentApprovedBy: string;
    indentType: string;
    attachment: string;
    planned1: string;
    actual1: string;
    timeDelay1: string;
    vendorType: string;
    approvedQuantity: number;
    planned2: string;
    actual2: string;
    timeDelay2: string;
    vendorName1: string;
    rate1: number;
    paymentTerm1: string;
    vendorName2: string;
    rate2: number;
    paymentTerm2: string;
    vendorName3: string;
    rate3: number;
    paymentTerm3: string;
    comparisonSheet: string;
    planned3: string;
    actual3: string;
    timeDelay3: string;
    approvedVendorName: string;
    approvedRate: number;
    approvedPaymentTerm: string;
    approvedDate: string;
    planned4: string;
    actual4: string;
    timeDelay4: string;
    poNumber: string;
    poCopy: string;
    planned5: string;
    actual5: string;
    timeDelay5: string;
    receiveStatus: string;
    planned6: string;
    actual6: string;
    timeDelay6: string;
    approvedBy: string;
    approvalDate: string;
    issuedQuantity: number;
    notes: string;
    planned7: string;
    actual7: string;
    timeDelay7: string;
    billStatus: string;
    billNumber: string;
    qty: number;
    leadTimeToLiftMaterial: string;
    typeOfBill: string;
    billAmount: number;
    discountAmount: number;
    paymentType: string;
    advanceAmountIfAny: number;
    photoOfBill: string;
    indentStatus: string;
    noDay: number;
    pendingPoQty: number;
    status: string;
    poQty: string;
    totalQty: number;
    receivedQty: number;
    rowIndex: string;
    issueStatus: string;
    liftingStatus: string;
    pendingLiftQty: number;
    firmNameMatch: string;
    paymentype: string;
};

// ✅ IMPROVED: Better field naming consistency
export type PIApprovalSheet = {
    rowIndex?: number;
    timestamp: string;
    piNo: string;                    // Maps to "PI-No."
    indentNo: string;                // Maps to "Indent No."
    partyName: string;               // Maps to "Party Name"
    productName: string;             // Maps to "Product Name"
    qty: number;                     // Maps to "Qty"
    piAmount: number;                // Maps to "P.I Amount"
    piCopy: string;                  // Maps to "P.I Copy" (URL to uploaded file)
    poRateWithoutTax: number;        // Maps to "Po Rate Without Tax"
    planned: string;                 // Maps to "Planned"
    actual: string;                  // Maps to "Actual"
    delay: string;                   // Maps to "Delay"
    status: string;                  // Maps to "Status"
    approvalAmount: number;          // Maps to "Approval Amoount" (note the typo in sheet)
};

// ✅ IMPROVED: Standardized field names
export type PaymentHistory = {
    timestamp: string;
    apPaymentNumber: string;         // Standardized to camelCase
    status: string;
    uniqueNumber: string;            // Standardized to camelCase
    fmsName: string;
    payTo: string;
    amountToBePaid: number;          // Standardized to camelCase
    remarks: string;
    anyAttachments: string;
};

export type ReceivedSheet = {
    timestamp: string;
    indentNumber: string;
    poDate: string;
    poNumber: string;
    vendor: string;
    receivedStatus: string;
    receivedQuantity: number;
    uom: string;
    photoOfProduct: string;
    warrantyStatus: string;
    endDate: string;
    billStatus: string;
    billNumber: string;
    billAmount: number;
    photoOfBill: string;
    anyTransportations: string;
    transporterName: string;
    transportingAmount: number;
    actual6: string;
    damageOrder: string;
    quantityAsPerBill: string;
    priceAsPerPo: string;
    remark: string;
};

export type InventorySheet = {
    groupHead: string;
    itemName: string;
    uom: string;
    maxLevel: number;
    opening: number;
    individualRate: number;
    indented: number;
    approved: number;
    purchaseQuantity: number;
    outQuantity: number;
    current: number;
    totalPrice: number;
    colorCode: string;
};

export type PoMasterSheet = {
    rowIndex?: number;  // ✅ ADDED: Important for updates
    discountPercent: number;
    gstPercent: number;
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
    preparedBy?: string;  // ✅ ADDED: Based on your sheet
    approvedBy?: string; 
    Guarantee?:string;	
    FreightPayment?:string;
    pdf: string;
    quotationNumber: string;
    quotationDate: string;
    enquiryNumber: string;
    enquiryDate: string;
    deliveryDate?: string;  // ✅ ADDED: From your sheet
    paymentTerms?: string;  // ✅ ADDED: From your sheet
    numberOfDays?: number;  // ✅ ADDED: From your sheet
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
    
    // ✅ ADDED: For PI Approval integration
    piApprovalTimestamp?: string;
    piQty?: number;
    piAmount?: number;
    piCopy?: string;
    poRateWithoutTax?: number;
    'Freight Payment'?: string;
};

export type Vendor = {
    vendorName: string;
    gstin: string;
    address: string;
    email: string;
};

export type MasterSheet = {
    vendors: Vendor[];
    vendorNames: string[];
    paymentTerms: string[];
    departments: string[];
    groupHeads: Record<string, string[]>; // category: items[]
    companyName: string;
    companyAddress: string;
    companyGstin: string;
    companyPhone: string;
    billingAddress: string;
    companyPan: string;
    destinationAddress: string;
    defaultTerms: string[];
    uoms: string[];
    firmsnames: string[];
    firms: string[];
    fmsNames: string[];
    firmCompanyMap: Record<string, { 
        companyName: string; 
        companyAddress: string; 
        destinationAddress: string; 
    }>;
};

export type UserPermissions = {
    rowIndex: number;
    username: string;
    password: string;
    name: string;
    administrate: boolean;
    createIndent: boolean;
    createPo: boolean;
    indentApprovalView: boolean;
    indentApprovalAction: boolean;
    updateVendorView: boolean;
    updateVendorAction: boolean;
    threePartyApprovalView: boolean;
    threePartyApprovalAction: boolean;
    receiveItemView: boolean;
    receiveItemAction: boolean;
    storeOutApprovalView: boolean;
    storeOutApprovalAction: boolean;
    pendingIndentsView: boolean;
    ordersView: boolean;
    poMaster: boolean;
    getPurchase: boolean;
    storeIssue: boolean;
    firmNameMatch: string;
    againAuditing: boolean;
    takeEntryByTelly: boolean;
    reauditData: boolean;
    rectifyTheMistake: boolean;
    auditData: boolean;
    sendDebitNote: boolean;
    returnMaterialToParty: boolean;
    exchangeMaterials: boolean;
    insteadOfQualityCheckInReceivedItem: boolean;
    dbForPc: boolean;
    billNotReceived: boolean;
    storeIn: boolean;
    issueData: boolean;
    piApprovalView?: boolean;  // ✅ ADDED: For PI Approval page access
    piApprovalAction?: boolean;  // ✅ ADDED: For PI Approval actions
};

export const allPermissionKeys = [
    "administrate",
    "createIndent",
    "createPo",
    "indentApprovalView",
    "indentApprovalAction",
    "updateVendorView",
    "updateVendorAction",
    "threePartyApprovalView",
    "threePartyApprovalAction",
    "receiveItemView",
    "receiveItemAction",
    "storeOutApprovalView",
    "storeOutApprovalAction",
    "pendingIndentsView",
    "ordersView",
    "poMaster",
    "storeIssue",
    "againAuditing",
    "takeEntryByTelly",
    "reauditData",
    "rectifyTheMistake",
    "auditData",
    "sendDebitNote",
    "returnMaterialToParty",
    "exchangeMaterials",
    "insteadOfQualityCheckInReceivedItem",
    "dbForPc",
    "billNotReceived",
    "storeIn",
    "issueData",
    "piApprovalView",    // ✅ ADDED
    "piApprovalAction",  // ✅ ADDED
] as const;

export type IssueSheet = {
    timestamp: string;
    rowIndex: number;
    issueNo: string;
    issueTo: string;
    uom: string;
    groupHead: string;
    productName: string;
    quantity: number;
    department: string;
    planned1?: string;
    actual1?: string;
    timeDelay1?: string;
    status: string;
    givenQty?: number;
};

export type StoreInSheet = {
    rowIndex?: number;
    timestamp: string;
    liftNumber: string;
    indentNo: string;
    billNo: string;
    vendorName: string;
    productName: string;
    qty: number;
    leadTimeToLiftMaterial: number;
    discountAmount: number;
    typeOfBill: string;
    billAmount: number;
    paymentType: string;
    advanceAmountIfAny: string;
    photoOfBill: string;
    transportationInclude: string;
    transporterName: string;
    amount: number;
    warrantyStatus: string;
    endDateWarrenty: string;
    planned6: string;
    actual6: string;
    timeDelay6: string;
    sendDebitNote: string;
    receivingStatus: string;
    billStatus: string;
    receivedQuantity: number;
    photoOfProduct: string;
    unitOfMeasurement: string;
    damageOrder: string;
    quantityAsPerBill: number;
    priceAsPerPo: number;
    remark: string;
    debitNoteCopy: string;
    planned7: string;
    actual7: string;
    timeDelay7: string;
    status: string;
    reason: string;
    billNumber: string;
    planned8: string;
    actual8: string;
    delay8: string;
    statusPurchaser: string;
    planned9: string;
    actual9: string;
    timeDelay9: string;
    billCopy: string;
    returnCopy: string;
    debitnotenumber: string;
    planned10: string;
    actual10: string;
    timeDelay10: string;
    warrenty: string;
    billReceived: string;
    billAmount2: string;
    billImage: string;
    exchangeQty: string;
    billNumber2: string;
    poDate: string;
    poNumber: string;
    vendor: string;
    indentNumber: string;
    product: string;
    uom: string;
    quantity: number;
    poCopy: string;
    planned11: string;
    actual11: string;
    billStatusNew: string;
    materialStatus: string;
    vehicleNo: string;
    driverName: string;
    driverMobileNo: string;
    billImageStatus: string;
    billRemark: string;
     productAsPerPack?: string; // ✅ ADD THIS LINE

    firmNameMatch: string;
    
};

export type TallyEntrySheet = {
    timestamp: string;
    indentNo: string;
    purchaseDate: string;
    indentDate: string;
    indentNumber: string;
    liftNumber: string;
    poNumber: string;
    materialInDate: string;
    productName: string;
    billNo: string;
    qty: number;
    partyName: string;
    billAmt: number;
    billImage: string;
    billReceivedLater: string;
    notReceivedBillNo: string;
    location: string;
    typeOfBills: string;
    productImage: string;
    area: string;
    indentedFor: string;
    approvedPartyName: string;
    rate: number;
    indentQty: number;
    totalRate: number;
    planned1: string;
    actual1: string;
    delay1: string;
    status1: string;
    remarks1: string;
    planned2: string;
    actual2: string;
    delay2: string;
    status2: string;
    remarks2: string;
    planned3: string;
    actual3: string;
    delay3: string;
    status3: string;
    remarks3: string;
    planned4: string;
    actual4: string;
    delay4: string;
    status4: string;
    remarks4: string;
    planned5: string;
    actual5: string;
    status5: string;
    rowIndex: string;
    firmNameMatch: string;
};

export type PcReportSheet = {
    stage: string;
    firmName?: string;
    totalPending: number | string;
    totalComplete: number | string;
    firmNameMatch?: string;
    pendingPmpl: string | number;
    pendingPurab: string | number;
    pendingPmmpl: string | number;
    pendingRefrasynth: string | number;
};

export type FullkittingSheet = {
    rowIndex?: number;
    timestamp: string;
    indentNumber: string;
    vendorName: string;
    productName: string;
    qty: number;
    billNo: string;
    transportingInclude: string;
    transporterName: string;
    amount: number;
    vehicleNo: string;
    driverName: string;
    driverMobileNo: string;
    planned: string;
    actual: string;
    timeDelay: string;
    fmsName: string;
    status?: string;
    vehicleNumber?: string;
    from?: string;
    to?: string;
    materialLoadDetails?: string;
    biltyNumber?: number;
    rateType?: string;
    amount1: number;
    biltyImage?: string;
    firmNameMatch: string;
};
