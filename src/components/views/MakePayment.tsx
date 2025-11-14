import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { Button } from '../ui/button';
import { DollarSign } from 'lucide-react';
import Heading from '../element/Heading';
import { useAuth } from '@/context/AuthContext';

interface MakePaymentData {
    indentNo: string;
    billNo: string;
    vendorName: string;
    productName: string;
    qty: number;
    billAmount: number;
    advanceAmount: number;  // Add this line
    paymentType: string;
    firmNameMatch: string;
    makePaymentLink: string;
}

interface StoreInItem {
    indentNo?: string;
    billNo?: string;
    billAmount?: number;
}

interface IndentSheetItem {
    firmNameMatch?: string;
    indentNumber?: string;
    planned7?: any;
    actual7?: any;
    makePaymentLink?: any;
    approvedVendorName?: string;
    vendorName1?: string;
    productName?: string;
    quantity?: number;
    paymentType?: string;
}

export default function MakePayment() {
    const { indentSheet, indentLoading, storeInSheet } = useSheets();
    const [tableData, setTableData] = useState<MakePaymentData[]>([]);
    const { user } = useAuth();

    // Filter data and merge with STORE IN sheet
    useEffect(() => {
        const filteredByFirm = indentSheet.filter((sheet: IndentSheetItem) =>
            user.firmNameMatch.toLowerCase() === "all" || sheet.firmNameMatch === user.firmNameMatch
        );

        // Create a map of STORE IN data by indent number for quick lookup
       // Update the storeInMap to include advanceAmount
const storeInMap = new Map(
    storeInSheet.map((item: StoreInItem) => [
        item.indentNo,
        {
            billNo: item.billNo || '',
            billAmount: item.billAmount || 0,
            advanceAmount:Number((item as any).advanceAmountIfAny) || 0,
        }
    ])
);

setTableData(
    filteredByFirm
        .filter((sheet: IndentSheetItem) => {
            const planned7IsNotNull = sheet.planned7 && sheet.planned7.toString().trim() !== '';
            const actual7IsNull = !sheet.actual7 || sheet.actual7.toString().trim() === '';
            const hasMakePaymentLink = sheet.makePaymentLink?.toString().trim() !== '';
            
            return planned7IsNotNull && actual7IsNull && hasMakePaymentLink;
        })
        .map((sheet: IndentSheetItem) => {
            const billData = storeInMap.get(sheet.indentNumber) || { 
                billNo: '', 
                billAmount: 0,
                advanceAmount: 0  // Add this line
            };
            
            return {
                indentNo: sheet.indentNumber || '',
                billNo: billData.billNo,
                vendorName: sheet.approvedVendorName || sheet.vendorName1 || '',
                productName: sheet.productName || '',
                qty: sheet.quantity || 0,
                billAmount: billData.billAmount,
                advanceAmount: billData.advanceAmount,  // Add this line
                paymentType: sheet.paymentType || '',
                firmNameMatch: sheet.firmNameMatch || '',
                makePaymentLink: sheet.makePaymentLink?.toString() || '',
            };
        })
        .sort((a, b) => b.indentNo.localeCompare(a.indentNo))
);

    }, [indentSheet, storeInSheet, user.firmNameMatch]);

    // Handle Make Payment button click - Open specific Google Form link
    const handleMakePayment = (item: MakePaymentData) => {
        if (item.makePaymentLink) {
            // Open the specific Google Form link in new tab
            window.open(item.makePaymentLink, '_blank');
        } else {
            console.warn('No payment link available for indent:', item.indentNo);
        }
    };

    // Table columns
   const columns: ColumnDef<MakePaymentData>[] = [
    {
        header: 'Action',
        cell: ({ row }: { row: Row<MakePaymentData> }) => {
            const item = row.original;
            return (
                <Button
                    variant="outline"
                    onClick={() => handleMakePayment(item)}
                    disabled={!item.makePaymentLink}
                >
                    Make Payment
                </Button>
            );
        },
    },
    { accessorKey: 'indentNo', header: 'Indent No.' },
    { accessorKey: 'firmNameMatch', header: 'Firm Name' },
    { accessorKey: 'billNo', header: 'Bill No.' },
    { accessorKey: 'vendorName', header: 'Vendor Name' },
    { accessorKey: 'productName', header: 'Product Name' },
    { accessorKey: 'qty', header: 'Qty' },
    {
        accessorKey: 'billAmount',
        header: 'Bill Amount',
        cell: ({ getValue }) => `₹${getValue() as number}`,
    },
    {
        accessorKey: 'advanceAmount',  // Add this column
        header: 'Advance Amount',
        cell: ({ getValue }) => `₹${getValue() as number}`,
    },
            { accessorKey: 'paymentType', header: 'Payment Type' },
];


    return (
        <div>
            <Heading heading="Make Payment" subtext="Process advance payments">
                <DollarSign size={50} className="text-green-600" />
            </Heading>

            <DataTable
                data={tableData}
                columns={columns}
                searchFields={['indentNo', 'billNo', 'vendorName', 'productName', 'firmNameMatch']}
                dataLoading={indentLoading}
            />
        </div>
    );
}