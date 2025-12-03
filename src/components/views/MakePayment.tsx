import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { Button } from '../ui/button';
import { DollarSign, CreditCard, Building, Package, FileText, Truck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface MakePaymentData {
    indentNo: string;
    billNo: string;
    vendorName: string;
    productName: string;
    qty: number;
    billAmount: number;
    advanceAmount: number;
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

    const [stats, setStats] = useState({
        total: 0,
        totalBillAmount: 0,
        totalAdvanceAmount: 0
    });

    // Filter data and merge with STORE IN sheet
    useEffect(() => {
        const filteredByFirm = indentSheet.filter((sheet: IndentSheetItem) =>
            user.firmNameMatch.toLowerCase() === "all" || sheet.firmNameMatch === user.firmNameMatch
        );

        // Create a map of STORE IN data by indent number for quick lookup
        const storeInMap = new Map(
            storeInSheet.map((item: StoreInItem) => [
                item.indentNo,
                {
                    billNo: item.billNo || '',
                    billAmount: item.billAmount || 0,
                    advanceAmount: Number((item as any).advanceAmountIfAny) || 0,
                }
            ])
        );

        const processedData = filteredByFirm
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
                    advanceAmount: 0
                };
                
                return {
                    indentNo: sheet.indentNumber || '',
                    billNo: billData.billNo,
                    vendorName: sheet.approvedVendorName || sheet.vendorName1 || '',
                    productName: sheet.productName || '',
                    qty: sheet.quantity || 0,
                    billAmount: billData.billAmount,
                    advanceAmount: billData.advanceAmount,
                    paymentType: sheet.paymentType || '',
                    firmNameMatch: sheet.firmNameMatch || '',
                    makePaymentLink: sheet.makePaymentLink?.toString() || '',
                };
            })
            .sort((a, b) => b.indentNo.localeCompare(a.indentNo));

        setTableData(processedData);

        // Calculate stats
        const totalBillAmount = processedData.reduce((sum, item) => sum + item.billAmount, 0);
        const totalAdvanceAmount = processedData.reduce((sum, item) => sum + item.advanceAmount, 0);

        setStats({
            total: processedData.length,
            totalBillAmount,
            totalAdvanceAmount
        });

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
                        variant="default"
                        size="sm"
                        onClick={() => handleMakePayment(item)}
                        disabled={!item.makePaymentLink}
                        className="bg-green-600 hover:bg-green-700 shadow-sm"
                    >
                        <CreditCard className="mr-2 h-3 w-3" />
                        Make Payment
                    </Button>
                );
            },
        },
        { 
            accessorKey: 'indentNo', 
            header: 'Indent No.',
            cell: ({ row }) => (
                <span className="font-medium text-blue-700">{row.original.indentNo}</span>
            )
        },
        { 
            accessorKey: 'firmNameMatch', 
            header: 'Firm',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50">
                    <Building className="mr-1 h-3 w-3" />
                    {row.original.firmNameMatch}
                </Badge>
            )
        },
        { 
            accessorKey: 'billNo', 
            header: 'Bill No.',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.billNo || 'N/A'}</span>
            )
        },
        { 
            accessorKey: 'vendorName', 
            header: 'Vendor',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.vendorName}</span>
            )
        },
        { 
            accessorKey: 'productName', 
            header: 'Product',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.productName}</span>
            )
        },
        { 
            accessorKey: 'qty', 
            header: 'Quantity',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-blue-50">
                    {row.original.qty}
                </Badge>
            )
        },
        {
            accessorKey: 'billAmount',
            header: 'Bill Amount',
            cell: ({ row }) => (
                <span className="font-semibold text-red-600">₹{row.original.billAmount?.toLocaleString('en-IN')}</span>
            ),
        },
        {
            accessorKey: 'advanceAmount',
            header: 'Advance',
            cell: ({ row }) => (
                <span className="font-semibold text-amber-600">₹{row.original.advanceAmount?.toLocaleString('en-IN')}</span>
            ),
        },
        { 
            accessorKey: 'paymentType', 
            header: 'Payment Type',
            cell: ({ row }) => {
                const type = row.original.paymentType;
                const isAdvance = type?.toLowerCase().includes('advance');
                return (
                    <Badge variant={isAdvance ? "default" : "outline"} className={isAdvance ? "bg-amber-100 text-amber-800" : ""}>
                        {type || 'N/A'}
                    </Badge>
                );
            }
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-600 rounded-lg shadow">
                            <DollarSign size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Make Payment</h1>
                            <p className="text-gray-600">Process and manage advance payments for purchase orders</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                                        <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
                                    </div>
                                    <CreditCard className="h-10 w-10 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Bill Amount</p>
                                        <p className="text-2xl font-bold text-red-600 mt-1">₹{stats.totalBillAmount.toLocaleString('en-IN')}</p>
                                    </div>
                                    <FileText className="h-10 w-10 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Advance Amount</p>
                                        <p className="text-2xl font-bold text-amber-600 mt-1">₹{stats.totalAdvanceAmount.toLocaleString('en-IN')}</p>
                                    </div>
                                    <DollarSign className="h-10 w-10 text-amber-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="bg-white shadow-lg border-0 mb-6">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-gray-800">Pending Payments</CardTitle>
                                <p className="text-gray-600 text-sm mt-1">Click "Make Payment" to process payments via Google Forms</p>
                            </div>
                            {stats.total === 0 ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    All Payments Processed
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700">
                                    {stats.total} Payments Pending
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {tableData.length > 0 ? (
                            <DataTable
                                data={tableData}
                                columns={columns}
                                searchFields={['indentNo', 'billNo', 'vendorName', 'productName', 'firmNameMatch', 'paymentType']}
                                dataLoading={indentLoading}
                                className="border rounded-lg"
                            />
                        ) : (
                            <div className="text-center py-12">
                                <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pending Payments</h3>
                                <p className="text-gray-500">All payments have been processed successfully.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>   
            </div>
        </div>
    );
}