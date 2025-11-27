import { Package2, FileText, Building, User, UserCheck, IndianRupee } from 'lucide-react';
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

    // Creating table columns with enhanced styling
    const historyColumns: ColumnDef<HistoryData>[] = [
        { 
            accessorKey: 'poNumber', 
            header: 'PO Number',
            cell: ({ getValue }) => (
                <div className="text-center font-bold text-blue-700">
                    {getValue() as string || '-'}
                </div>
            )
        },
        {
            accessorKey: 'poCopy',
            header: 'PO Copy',
            cell: ({ row }) => {
                const attachment = row.original.poCopy;
                return attachment ? (
                    <div className="flex justify-center">
                        <a 
                            href={attachment} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                            <FileText className="h-4 w-4" />
                            View PDF
                        </a>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <span className="text-gray-400 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200">
                            No PDF
                        </span>
                    </div>
                );
            },
        },
        { 
            accessorKey: 'vendorName', 
            header: 'Vendor Name',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Building className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string || '-'}
                </div>
            )
        },
        { 
            accessorKey: 'preparedBy', 
            header: 'Prepared By',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <User className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string || '-'}
                </div>
            )
        },
        { 
            accessorKey: 'approvedBy', 
            header: 'Approved By',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <UserCheck className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string || '-'}
                </div>
            )
        },
        {
            accessorKey: 'totalAmount',
            header: 'Amount',
            cell: ({ row }) => {
                const amount = row.original.totalAmount || 0;
                return (
                    <div className="text-center font-bold text-green-700 flex items-center justify-center gap-1">
                        <IndianRupee className="h-4 w-4" />
                        {amount.toLocaleString('en-IN')}
                    </div>
                );
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
                
                return (
                    <div className="flex justify-center">
                        <Pill 
                            variant={variant} 
                            className="font-semibold text-sm px-3 py-2"
                        >
                            {status}
                        </Pill>
                    </div>
                );
            }
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 mb-6">
                    <Heading heading="PO History" subtext="View purchase orders and their status">
                        <Package2 size={50} className="text-blue-600" />
                    </Heading>

                    <DataTable
                        data={historyData}
                        columns={historyColumns}
                        searchFields={['vendorName', 'poNumber', 'preparedBy', 'approvedBy']}
                        dataLoading={poMasterLoading}
                        className='h-[80dvh] rounded-lg border-2 border-gray-200'
                    />
                </div>
            </div>
        </div>
    );
};