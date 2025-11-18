import { Package2 } from 'lucide-react';
import Heading from '../element/Heading';
import { useSheets } from '@/context/SheetsContext';
import { useEffect, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import { Pill } from '../ui/pill';
import { useAuth } from '@/context/AuthContext';

interface HistoryData {
    poNumber: string;
    poCopy: string;
    vendorName: string;
    preparedBy: string;
    approvedBy: string;
    totalAmount: number;
    status: 'Revised' | 'Not Received' | 'Received' | 'Unknown';
}

interface POMasterRecord {
    approvedBy?: string;
    pdf?: string;
    poNumber?: string;
    preparedBy?: string;
    totalPoAmount?: string | number;
    partyName?: string;
    firmNameMatch?: string;
}

interface IndentRecord {
    poNumber?: string;
}

interface ReceivedRecord {
    poNumber?: string;
}

export default function POHistory() {
    const { poMasterLoading, poMasterSheet, indentSheet, receivedSheet } = useSheets();
    const { user } = useAuth();
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);

    useEffect(() => {
        try {
            // Safe array check
            const safePoMasterSheet: POMasterRecord[] = Array.isArray(poMasterSheet) ? poMasterSheet : [];
            
            const filteredByFirm = safePoMasterSheet.filter((sheet: POMasterRecord) => 
                user?.firmNameMatch?.toLowerCase() === "all" || 
                sheet?.firmNameMatch === user?.firmNameMatch
            );
            
            const processedHistoryData: HistoryData[] = filteredByFirm.map((sheet: POMasterRecord) => ({
                approvedBy: sheet?.approvedBy || '',
                poCopy: sheet?.pdf || '',
                poNumber: sheet?.poNumber || '',
                preparedBy: sheet?.preparedBy || '',
                totalAmount: Number(sheet?.totalPoAmount) || 0,
                vendorName: sheet?.partyName || '',
                
                // Safe status calculation
                status: (() => {
                    try {
                        const safeIndentSheet: IndentRecord[] = Array.isArray(indentSheet) ? indentSheet : [];
                        const safeReceivedSheet: ReceivedRecord[] = Array.isArray(receivedSheet) ? receivedSheet : [];
                        
                        const poNumber = sheet?.poNumber;
                        if (!poNumber) return 'Unknown';
                        
                        const isInIndentSheet = safeIndentSheet
                            .some((s: IndentRecord) => s?.poNumber === poNumber);
                            
                        const isInReceivedSheet = safeReceivedSheet
                            .some((r: ReceivedRecord) => r?.poNumber === poNumber);
                        
                        if (isInIndentSheet) {
                            return isInReceivedSheet ? 'Received' : 'Not Received';
                        }
                        return 'Revised';
                    } catch (error) {
                        console.warn('Error calculating status:', error);
                        return 'Unknown';
                    }
                })()
            }));
            
            setHistoryData(processedHistoryData);
            
        } catch (error) {
            console.error('❌ Error in useEffect:', error);
            setHistoryData([]);
        }
    }, [indentSheet, poMasterSheet, receivedSheet, user?.firmNameMatch]);

    // Creating table columns
    const historyColumns: ColumnDef<HistoryData>[] = [
        { 
            accessorKey: 'poNumber', 
            header: 'PO Number',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'poCopy',
            header: 'PO Copy',
            cell: ({ row }) => {
                const attachment = row.original.poCopy;
                return attachment ? (
                    <a href={attachment} target="_blank" rel="noopener noreferrer">
                        PDF
                    </a>
                ) : (
                    <span className="text-gray-400">No PDF</span>
                );
            },
        },
        { 
            accessorKey: 'vendorName', 
            header: 'Vendor Name',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        { 
            accessorKey: 'preparedBy', 
            header: 'Prepared By',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        { 
            accessorKey: 'approvedBy', 
            header: 'Approved By',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'totalAmount',
            header: 'Amount',
            cell: ({ row }) => {
                return <div>&#8377;{(row.original.totalAmount || 0).toLocaleString('en-IN')}</div>;
            },
        },
        { 
            accessorKey: 'status', 
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const variant = 
                    status === "Not Received" ? "secondary" : 
                    status === "Received" ? "primary" : 
                    "default";
                
                return <Pill variant={variant}>{status}</Pill>;
            }
        },
    ];

    return (
        <div>
            <Heading heading="PO History" subtext="View purchase orders">
                <Package2 size={50} className="text-primary" />
            </Heading>

            <DataTable
                data={historyData}
                columns={historyColumns}
                searchFields={['vendorName', 'poNumber', 'preparedBy', 'approvedBy']}
                dataLoading={poMasterLoading}
                className='h-[80dvh]'
            />
        </div>
    );
};