import { CheckCircle } from 'lucide-react';
import Heading from '../element/Heading';
import { useSheets } from '@/context/SheetsContext';
import { useEffect, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import DataTable from '../element/DataTable';
import { useAuth } from '@/context/AuthContext';
import { Pill } from '../ui/pill';

interface ApprovedPOData {
    date: string;
    plannedDate: string;
    indentNo: string;
    product: string;
    quantity: number;
    rate: number;
    uom: string;
    vendorName: string;
    paymentTerm: string;
    specifications: string;
    firmNameMatch: string;
    poRequired: string;
    poRequiredStatus: 'Yes';
}

interface IndentSheetRecord {
    timestamp?: string | number | Date;
    firmName?: string;
    firmNameMatch?: string;
    poRequred?: string;
    planned4?: string | number | Date;
    indentNumber?: string;
    productName?: string;
    pendingPoQty?: string | number;
    quantity?: string | number;
    approvedRate?: string | number;
    rate1?: string | number;
    uom?: string;
    approvedVendorName?: string;
    vendorName1?: string;
    approvedPaymentTerm?: string;
    paymentTerm1?: string;
    specifications?: string;
}

export default function ApprovedPOs() {
    const { indentSheet, indentLoading } = useSheets();
    const { user } = useAuth();

    const [approvedTableData, setApprovedTableData] = useState<ApprovedPOData[]>([]);

    useEffect(() => {
        console.log(indentSheet);
    }, [indentSheet]);

    // Fetching approved PO data (ONLY "Yes" entries)
    useEffect(() => {
        // Filter by firm name first
        const filteredByFirm = indentSheet.filter((sheet: IndentSheetRecord) => 
            user?.firmNameMatch?.toLowerCase() === "all" || sheet.firmName === user?.firmNameMatch
        );
        
        const mappedData = filteredByFirm
            .filter((sheet: IndentSheetRecord) => {
                // Show ONLY when poRequred (column BT) has "Yes" value
                return sheet.poRequred && 
                       sheet.poRequred.toString().trim() === 'Yes';
            })
            .map((sheet: IndentSheetRecord) => {
                let formattedDate = '';
                let formattedPlannedDate = '';
                
                try {
                    if (sheet.timestamp) {
                        formattedDate = formatDate(new Date(sheet.timestamp));
                    }
                } catch (error) {
                    console.warn('Invalid timestamp format:', sheet.timestamp);
                }

                try {
                    if (sheet.planned4) {
                        formattedPlannedDate = formatDate(new Date(sheet.planned4));
                    }
                } catch (error) {
                    console.warn('Invalid planned date format:', sheet.planned4);
                }

                return {
                    date: formattedDate,
                    plannedDate: formattedPlannedDate,
                    indentNo: sheet.indentNumber?.toString() || '',
                    firmNameMatch: sheet.firmNameMatch || '',
                    product: sheet.productName || '',
                    quantity: Number(sheet.pendingPoQty) || Number(sheet.quantity) || 0,
                    rate: Number(sheet.approvedRate) || Number(sheet.rate1) || 0,
                    uom: sheet.uom || '',
                    vendorName: sheet.approvedVendorName || sheet.vendorName1 || '',
                    paymentTerm: sheet.approvedPaymentTerm || sheet.paymentTerm1 || '',
                    specifications: sheet.specifications || '',
                    poRequired: sheet.poRequred?.toString() || '',
                    poRequiredStatus: 'Yes' as const,
                };
            })
            // Sort by indentNo in descending order
            .sort((a, b) => b.indentNo.localeCompare(a.indentNo));

        setApprovedTableData(mappedData);
    }, [indentSheet, user?.firmNameMatch]);

    // Creating approved PO table columns (same as history but only for "Yes" entries)
    const approvedColumns: ColumnDef<ApprovedPOData>[] = [
        {
            accessorKey: 'date',
            header: 'Date',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'plannedDate',
            header: 'Planned Date',
            cell: ({ getValue }) => {
                const plannedDate = getValue() as string;
                return (
                    <div className="px-2">
                        {plannedDate || '-'}
                    </div>
                );
            }
        },
        {
            accessorKey: 'indentNo',
            header: 'Indent Number',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'firmNameMatch',
            header: 'Firm Name',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'product',
            header: 'Product',
            cell: ({ getValue }) => (
                <div className="max-w-[120px] break-words whitespace-normal px-1 text-sm">
                    {getValue() as string || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'quantity',
            header: 'Pending PO Qty',
            cell: ({ getValue }) => <div className="px-2">{getValue() as number || 0}</div>
        },
        {
            accessorKey: 'rate',
            header: 'Rate',
            cell: ({ row }) => (
                <div className="px-2">
                    &#8377;{row.original.rate || 0}
                </div>
            ),
        },
        {
            accessorKey: 'uom',
            header: 'UOM',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'vendorName',
            header: 'Vendor Name',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'paymentTerm',
            header: 'Payment Term',
            cell: ({ getValue }) => <div className="px-2">{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'specifications',
            header: 'Specifications',
            cell: ({ getValue }) => (
                <div className="max-w-[150px] break-words whitespace-normal px-2 text-sm">
                    {getValue() as string || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'poRequiredStatus',
            header: 'PO Required',
            cell: ({ row }) => {
                const status = row.original.poRequiredStatus;
                return (
                    <div className="px-2">
                        <Pill variant="primary">{status}</Pill>
                    </div>
                );
            },
        },
    ];

    return (
        <div>
            <Heading 
                heading="Approved POs" 
                subtext="View all approved purchase orders (PO Required: Yes)"
            >
                <CheckCircle size={50} className="text-green-600" />
            </Heading>
            
            <DataTable
                data={approvedTableData}
                columns={approvedColumns}
                searchFields={['product', 'vendorName', 'paymentTerm', 'specifications', 'firmNameMatch']}
                dataLoading={indentLoading}
                className="h-[80dvh]"
            />
        </div>
    );
}