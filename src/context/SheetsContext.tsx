import { fetchSheet } from '@/lib/fetchers';
import type {
    IndentSheet,
    InventorySheet,
    MasterSheet,
    PoMasterSheet,
    ReceivedSheet,
    StoreInSheet,
    IssueSheet,
    TallyEntrySheet,
    PcReportSheet,
    FullkittingSheet,
    PaymentHistory,
} from '@/types';

import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SheetsState {
    updateReceivedSheet: () => void;
    updatePoMasterSheet: () => void;
    updateIndentSheet: () => void;
    updateAll: () => void;

    updateIssueSheet: () => void;
    issueSheet: IssueSheet[];
    issueLoading: boolean;
    sheets: StoreInSheet[];


    indentSheet: IndentSheet[];
    storeInSheet: StoreInSheet[];
    poMasterSheet: PoMasterSheet[];
    receivedSheet: ReceivedSheet[];
    inventorySheet: InventorySheet[];
    pcReportSheet: PcReportSheet[];
    masterSheet: MasterSheet | undefined;

    indentLoading: boolean;
    poMasterLoading: boolean;
    receivedLoading: boolean;
    inventoryLoading: boolean;
    allLoading: boolean;

    updateStoreInSheet: () => void;
    storeInLoading: boolean;

    tallyEntrySheet: TallyEntrySheet[];
    tallyEntryLoading: boolean;
    updateTallyEntrySheet: () => void;

    updatePcReportSheet: () => void;

    fullkittingSheet: FullkittingSheet[];
    fullkittingLoading: boolean;
    updateFullkittingSheet: () => void;

    // ✅ ADD PAYMENT HISTORY HERE
    paymentHistorySheet: PaymentHistory[];
    paymentHistoryLoading: boolean;
    updatePaymentHistorySheet: () => void;
}

const SheetsContext = createContext<SheetsState | null>(null);

export const SheetsProvider = ({ children }: { children: React.ReactNode }) => {
    const [indentSheet, setIndentSheet] = useState<IndentSheet[]>([]);
    const [storeSheet, setStoreInSheet] = useState<StoreInSheet[]>([]);
    const [receivedSheet, setReceivedSheet] = useState<ReceivedSheet[]>([]);
    const [poMasterSheet, setPoMasterSheet] = useState<PoMasterSheet[]>([]);
    const [inventorySheet, setInventorySheet] = useState<InventorySheet[]>([]);
    const [masterSheet, setMasterSheet] = useState<MasterSheet>();

    const [tallyEntrySheet, setTallyEntrySheet] = useState<TallyEntrySheet[]>([]);
    const [pcReportSheet, setPcReportSheet] = useState<PcReportSheet[]>([]);
    const [fullkittingSheet, setFullkittingSheet] = useState<FullkittingSheet[]>([]);
    const [fullkittingLoading, setFullkittingLoading] = useState(true);

    const [tallyEntryLoading, setTallyEntryLoading] = useState(true);

    const [issueSheet, setIssueSheet] = useState<IssueSheet[]>([]);
    const [issueLoading, setIssueLoading] = useState(true);

    const [indentLoading, setIndentLoading] = useState(true);
    const [poMasterLoading, setPoMasterLoading] = useState(true);
    const [receivedLoading, setReceivedLoading] = useState(true);
    const [inventoryLoading, setInventoryLoading] = useState(true);
    const [allLoading, setAllLoading] = useState(true);

    const [storeInLoading, setStoreInLoading] = useState(true);

    // ✅ ADD PAYMENT HISTORY STATE
    const [paymentHistorySheet, setPaymentHistorySheet] = useState<PaymentHistory[]>([]);
    const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(true);

   const sheets = storeSheet;

    function updateStoreInSheet() {
        setStoreInLoading(true);
        fetchSheet('STORE IN')
            .then((res) => {
                setStoreInSheet(res as StoreInSheet[]);
                setStoreInLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching STORE IN:', error);
                setStoreInLoading(false);
            });
    }
    function updateIssueSheet() {
        setIssueLoading(true);
        fetchSheet('ISSUE').then((res) => {
            setIssueSheet(res as unknown as IssueSheet[]);
            setIssueLoading(false);
        });
    }

    function updateIndentSheet() {
        setIndentLoading(true);
        fetchSheet('INDENT').then((res) => {
            setIndentSheet(res as IndentSheet[]);
            setIndentLoading(false);
        });
    }

    function updateReceivedSheet() {
        setReceivedLoading(true);
        fetchSheet('RECEIVED').then((res) => {
            setReceivedSheet(res as ReceivedSheet[]);
            setReceivedLoading(false);
        });
    }

    function updatePoMasterSheet() {
        setPoMasterLoading(true);
        fetchSheet('PO MASTER').then((res) => {
            // @ts-ignore - Suppress TypeScript error
            setPoMasterSheet(res as PoMasterSheet[]);
            setPoMasterLoading(false);
        });
    }

    function updateInventorySheet() {
        setInventoryLoading(true);
        fetchSheet('INVENTORY').then((res) => {
            setInventorySheet(res as InventorySheet[]);
            setInventoryLoading(false);
        });
    }

    function updateMasterSheet() {
        fetchSheet('MASTER').then((res) => {
            setMasterSheet(res as MasterSheet);
        });
    }

    function updateFullkittingSheet() {
        setFullkittingLoading(true);
        fetchSheet('Fullkitting')
            .then((res) => {
                setFullkittingSheet(res as unknown as FullkittingSheet[]);
                setFullkittingLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching Fullkitting:', error);
                setFullkittingLoading(false);
            });
    }

    // ✅ ADD PAYMENT HISTORY FUNCTION
    function updatePaymentHistorySheet() {
        setPaymentHistoryLoading(true);
        fetchSheet('Payment History')
            .then((res) => {
                setPaymentHistorySheet(res as PaymentHistory[]);
                setPaymentHistoryLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching PAYMENT HISTORY:', error);
                setPaymentHistoryLoading(false);
            });
    }

    function updateAll() {
        setAllLoading(true);
        updateMasterSheet();
        updateReceivedSheet();
        updateIndentSheet();
        updatePoMasterSheet();
        updateInventorySheet();
        
        updateStoreInSheet();
        updateIssueSheet();
        updateTallyEntrySheet();
        updatePcReportSheet();
        updateFullkittingSheet();
        
        // ✅ ADD PAYMENT HISTORY TO UPDATE ALL
        updatePaymentHistorySheet();
        
        setAllLoading(false);
    }

    useEffect(() => {
        try {
            updateAll();
            toast.success('Fetched all the data');
        } catch (e) {
            toast.error('Something went wrong while fetching data');
        } finally {
        }
    }, []);

    function updateTallyEntrySheet() {
        setTallyEntryLoading(true);
        fetchSheet('TALLY ENTRY')
            .then((res) => {
                setTallyEntrySheet(res as TallyEntrySheet[]);
                setTallyEntryLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching TALLY ENTRY:', error);
                setTallyEntryLoading(false);
            });
    }

    function updatePcReportSheet() {
        fetchSheet('PC REPORT')
            .then((res) => setPcReportSheet(res as PcReportSheet[]))
            .catch((err) => console.error('Error fetching PC REPORT:', err));
    }

    return (
        <SheetsContext.Provider
            value={{
                updateIndentSheet,
                updatePoMasterSheet,
                updateReceivedSheet,
                updateAll,
                indentSheet,
                sheets,
                poMasterSheet,
                inventorySheet,
                receivedSheet,
                indentLoading,
                masterSheet,
                poMasterLoading,
                receivedLoading,
                inventoryLoading,
                allLoading,
                storeInSheet: storeSheet,

                updateIssueSheet,
                issueSheet,
                issueLoading,

                updateStoreInSheet,
                storeInLoading,

                tallyEntrySheet,
                tallyEntryLoading,
                updateTallyEntrySheet,

                pcReportSheet,
                updatePcReportSheet,

                fullkittingSheet,
                fullkittingLoading,
                updateFullkittingSheet,

                // ✅ ADD PAYMENT HISTORY TO CONTEXT VALUE
                paymentHistorySheet,
                paymentHistoryLoading,
                updatePaymentHistorySheet,
            }}
        >
            {children}
        </SheetsContext.Provider>
    );
};

export const useSheets = () => useContext(SheetsContext)!;