import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { PuffLoader as Loader } from 'react-spinners';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { postToSheet, uploadFile } from '@/lib/fetchers';
import { Truck, FileText, Receipt, Upload, Building, Package, DollarSign, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface StoreInPendingData {
    liftNumber: string;
    indentNumber: string;
    billNo: string;
    vendorName: string;
    productName: string;
    qty: number;
    typeOfBill: string;
    billAmount: number;
    paymentType: string;
    advanceAmountIfAny: number;
    photoOfBill: string;
    transportationInclude: string;
    transporterName: string;
    amount: number;
    firmNameMatch: string;
    reason: string;
}

interface StoreInHistoryData {
    liftNumber: string;
    indentNumber: string;
    billNo: string;
    vendorName: string;
    productName: string;
    qty: number;
    typeOfBill: string;
    billAmount: number;
    paymentType: string;
    advanceAmountIfAny: number;
    photoOfBill: string;
    transportationInclude: string;
    status: string;
    reason: string;
    billNumber: string;
    statusPurchaser: string;
    debitNoteCopy: string;
    billCopy: string;
    returnCopy: string;
    firmNameMatch: string;
}

export default () => {
    const { storeInSheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [pendingData, setPendingData] = useState<StoreInPendingData[]>([]);
    const [historyData, setHistoryData] = useState<StoreInHistoryData[]>([]);
    const [selectedItem, setSelectedItem] = useState<StoreInPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    const [uploadingFile, setUploadingFile] = useState(false);

    const [stats, setStats] = useState({
        pending: 0,
        processed: 0,
        totalAmount: 0
    });

    useEffect(() => {
        const filteredByFirm = storeInSheet.filter(item => 
            user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );
        
        const pendingItems = filteredByFirm.filter((i) => i.planned9 !== '' && i.actual9 === '');
        const historyItems = filteredByFirm.filter((i) => i.planned9 !== '' && i.actual9 !== '');
        
        setPendingData(
            pendingItems.map((i) => ({
                liftNumber: i.liftNumber || '',
                indentNumber: i.indentNo || '',
                billNo: i.billNo || '',
                vendorName: i.vendorName || '',
                productName: i.productName || '',
                qty: i.qty || 0,
                typeOfBill: i.typeOfBill || '',
                billAmount: i.billAmount || 0,
                paymentType: i.paymentType || '',
                advanceAmountIfAny: Number(i.advanceAmountIfAny) || 0,
                photoOfBill: i.photoOfBill || '',
                transportationInclude: i.transportationInclude || '',
                transporterName: i.transporterName || '',
                amount: i.amount || 0,
                firmNameMatch: i.firmNameMatch || '',
                reason: i.reason || '',
            }))
        );

        setHistoryData(
            historyItems.map((i) => ({
                liftNumber: i.liftNumber || '',
                indentNumber: i.indentNo || '',
                billNo: i.billNo || '',
                vendorName: i.vendorName || '',
                productName: i.productName || '',
                qty: i.qty || 0,
                typeOfBill: i.typeOfBill || '',
                billAmount: i.billAmount || 0,
                paymentType: i.paymentType || '',
                advanceAmountIfAny: Number(i.advanceAmountIfAny) || 0,
                photoOfBill: i.photoOfBill || '',
                transportationInclude: i.transportationInclude || '',
                status: i.status || '',
                reason: i.reason || '',
                billNumber: i.billNo || '',
                statusPurchaser: i.statusPurchaser || '',
                debitNoteCopy: i.debitNoteCopy || '',
                billCopy: i.billCopy || '',
                returnCopy: i.returnCopy || '',
                firmNameMatch: i.firmNameMatch || '',
            }))
        );

        const totalAmount = pendingItems.reduce((sum, item) => sum + (item.billAmount || 0), 0);
        
        setStats({
            pending: pendingItems.length,
            processed: historyItems.length,
            totalAmount
        });

    }, [storeInSheet, user.firmNameMatch]);

    const pendingColumns: ColumnDef<StoreInPendingData>[] = [
        ...(user.receiveItemView
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<StoreInPendingData> }) => {
                        const item = row.original;
                        return (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                    setSelectedItem(item);
                                    setOpenDialog(true);
                                }}
                                className="bg-purple-600 hover:bg-purple-700 shadow-sm"
                            >
                                <Receipt className="mr-2 h-3 w-3" />
                                Send DN
                            </Button>
                        );
                    },
                },
            ]
            : []),
        { 
            accessorKey: 'liftNumber', 
            header: 'Lift No.',
            cell: ({ row }) => (
                <span className="font-medium text-purple-700">{row.original.liftNumber}</span>
            )
        },
        { 
            accessorKey: 'indentNumber', 
            header: 'Indent No.',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.indentNumber}</span>
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
                <span className="font-medium">{row.original.billNo}</span>
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
            header: 'Qty',
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
                <span className="font-semibold text-green-600">₹{row.original.billAmount?.toLocaleString('en-IN')}</span>
            )
        },
        { 
            accessorKey: 'paymentType', 
            header: 'Payment',
            cell: ({ row }) => {
                const type = row.original.paymentType;
                const isAdvance = type?.toLowerCase().includes('advance');
                return (
                    <Badge variant={isAdvance ? "default" : "outline"} className={isAdvance ? "bg-amber-100 text-amber-800" : ""}>
                        {type || '-'}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'photoOfBill',
            header: 'Bill',
            cell: ({ row }) => {
                const photo = row.original.photoOfBill;
                return photo ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(photo, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        <FileText className="mr-1 h-3 w-3" />
                        View
                    </Button>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { 
            accessorKey: 'transportationInclude', 
            header: 'Transport',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50">
                    {row.original.transportationInclude || '-'}
                </Badge>
            )
        },
        { 
            accessorKey: 'amount', 
            header: 'Amount',
            cell: ({ row }) => (
                <span className="font-medium">₹{row.original.amount?.toLocaleString('en-IN')}</span>
            )
        },
        { 
            accessorKey: 'reason', 
            header: 'Reason',
            cell: ({ row }) => (
                <div className="max-w-xs truncate" title={row.original.reason}>
                    {row.original.reason || '-'}
                </div>
            )
        },
    ];

    const historyColumns: ColumnDef<StoreInHistoryData>[] = [
        { 
            accessorKey: 'liftNumber', 
            header: 'Lift No.',
            cell: ({ row }) => (
                <span className="font-medium text-purple-700">{row.original.liftNumber}</span>
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
            accessorKey: 'indentNumber', 
            header: 'Indent No.',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.indentNumber}</span>
            )
        },
        { 
            accessorKey: 'billNo', 
            header: 'Bill No.',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.billNo}</span>
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
            header: 'Qty',
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
                <span className="font-semibold text-green-600">₹{row.original.billAmount?.toLocaleString('en-IN')}</span>
            )
        },
        { 
            accessorKey: 'paymentType', 
            header: 'Payment',
            cell: ({ row }) => {
                const type = row.original.paymentType;
                const isAdvance = type?.toLowerCase().includes('advance');
                return (
                    <Badge variant={isAdvance ? "default" : "outline"} className={isAdvance ? "bg-amber-100 text-amber-800" : ""}>
                        {type || '-'}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'photoOfBill',
            header: 'Bill',
            cell: ({ row }) => {
                const photo = row.original.photoOfBill;
                return photo ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(photo, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        <FileText className="mr-1 h-3 w-3" />
                        View
                    </Button>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { 
            accessorKey: 'transportationInclude', 
            header: 'Transport',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50">
                    {row.original.transportationInclude || '-'}
                </Badge>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const isReturn = status === 'Return';
                return (
                    <Badge
                        variant={isReturn ? "default" : "outline"}
                        className={`inline-flex items-center gap-1 ${
                            isReturn
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                        }`}
                    >
                        {isReturn ? (
                            <Receipt className="h-3 w-3" />
                        ) : (
                            <FileText className="h-3 w-3" />
                        )}
                        {status || '-'}
                    </Badge>
                );
            },
        },
        { 
            accessorKey: 'reason', 
            header: 'Reason',
            cell: ({ row }) => (
                <div className="max-w-xs truncate" title={row.original.reason}>
                    {row.original.reason || '-'}
                </div>
            )
        },
        {
            accessorKey: 'statusPurchaser',
            header: 'Purchaser Status',
            cell: ({ row }) => {
                const status = row.original.statusPurchaser;
                const isReturn = status === 'Return to Party';
                return (
                    <Badge
                        variant={isReturn ? "default" : "outline"}
                        className={`inline-flex items-center gap-1 ${
                            isReturn
                                ? 'bg-purple-100 text-purple-800 hover:bg-purple-100'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                        }`}
                    >
                        {isReturn ? (
                            <Package className="h-3 w-3" />
                        ) : (
                            <Building className="h-3 w-3" />
                        )}
                        {status || '-'}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'debitNoteCopy',
            header: 'Debit Note',
            cell: ({ row }) => {
                const file = row.original.debitNoteCopy;
                return file ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        <FileText className="mr-1 h-3 w-3" />
                        View
                    </Button>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        {
            accessorKey: 'billCopy',
            header: 'Bill Copy',
            cell: ({ row }) => {
                const file = row.original.billCopy;
                return file ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file, '_blank')}
                        className="text-green-600 hover:text-green-800"
                    >
                        <FileText className="mr-1 h-3 w-3" />
                        View
                    </Button>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        {
            accessorKey: 'returnCopy',
            header: 'Return Copy',
            cell: ({ row }) => {
                const file = row.original.returnCopy;
                return file ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file, '_blank')}
                        className="text-purple-600 hover:text-purple-800"
                    >
                        <FileText className="mr-1 h-3 w-3" />
                        View
                    </Button>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
    ];

    const schema = z.object({
        debitNoteCopy: z.instanceof(File).optional(),
        debitNoteNumber: z.string().optional(),
    });

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            debitNoteCopy: undefined,
            debitNoteNumber: '',
        },
    });

    useEffect(() => {
        if (!openDialog) {
            form.reset({
                debitNoteCopy: undefined,
                debitNoteNumber: '',
            });
        }
    }, [openDialog, form]);

    async function onSubmit(values: z.infer<typeof schema>) {
        try {
            console.log('📝 Form values:', values);
            console.log('📦 Selected item:', selectedItem);
            
            const currentDateTime = new Date()
                .toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                })
                .replace(',', '');

            let debitNoteCopyUrl: string = '';

            if (values.debitNoteCopy) {
                try {
                    setUploadingFile(true);
                    console.log('📤 Uploading debit note copy...');
                    debitNoteCopyUrl = await uploadFile({
                        file: values.debitNoteCopy,
                        folderId: import.meta.env.VITE_COMPARISON_SHEET_FOLDER
                    });
                    console.log('✅ File uploaded:', debitNoteCopyUrl);
                } catch (uploadError) {
                    console.error('❌ Upload error:', uploadError);
                    toast.error('Failed to upload file');
                    return;
                } finally {
                    setUploadingFile(false);
                }
            }

            const filteredData = storeInSheet.filter(
                (s) => s.liftNumber === selectedItem?.liftNumber
            );

            console.log('🔍 Filtered data:', filteredData);

            if (filteredData.length === 0) {
                console.error('❌ No matching record found');
                toast.error('No matching record found');
                return;
            }

            const updateData = filteredData.map((prev) => ({
                rowIndex: prev.rowIndex,
                actual9: currentDateTime,
                debitNoteCopy: debitNoteCopyUrl,
                debitNoteNumber: values.debitNoteNumber,
            }));

            console.log('📤 Update data:', updateData);

            await postToSheet(updateData, 'update', 'STORE IN');

            console.log('✅ Update successful');
            toast.success(`Debit note sent for ${selectedItem?.indentNumber}`);
            setOpenDialog(false);
            setTimeout(() => updateAll(), 1000);
        } catch (error) {
            console.error('❌ Error in onSubmit:', error);
            
            if (error instanceof Error) {
                toast.error(`Failed to update: ${error.message}`);
            } else {
                toast.error('Failed to update status');
            }
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-600 rounded-lg shadow">
                            <Truck size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Send Debit Note</h1>
                            <p className="text-gray-600">Process and send debit notes for store items</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Pending DN</p>
                                        <p className="text-2xl font-bold text-purple-600 mt-1">{stats.pending}</p>
                                    </div>
                                    <AlertCircle className="h-10 w-10 text-purple-500" />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Amount</p>
                                        <p className="text-2xl font-bold text-green-600 mt-1">
                                            ₹{stats.totalAmount.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <DollarSign className="h-10 w-10 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Processed</p>
                                        <p className="text-2xl font-bold text-blue-600 mt-1">{stats.processed}</p>
                                    </div>
                                    <CheckCircle className="h-10 w-10 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="bg-white shadow-lg border-0 mb-6">
                    <CardContent className="p-0">
                        <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
                            <div className="border-b">
                                <TabsList className="h-14 bg-transparent px-6">
                                    <TabsTrigger 
                                        value="pending" 
                                        className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none h-14 px-4"
                                    >
                                        <AlertCircle className="mr-2 h-4 w-4" />
                                        Pending Debit Notes
                                        {stats.pending > 0 && (
                                            <span className="ml-2 bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                                {stats.pending}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="history" 
                                        className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none h-14 px-4"
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        History
                                        {stats.processed > 0 && (
                                            <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                                {stats.processed}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            
                            <div className="p-6">
                                {/* PENDING TAB CONTENT */}
                                <TabsContent value="pending" className="m-0">
                                    {pendingData.length > 0 ? (
                                        <DataTable
                                            data={pendingData}
                                            columns={pendingColumns}
                                            searchFields={[
                                                'liftNumber',
                                                'indentNumber',
                                                'productName',
                                                'vendorName',
                                                'firmNameMatch',
                                                'billNo'
                                            ]}
                                            dataLoading={false}
                                            className="border rounded-lg"
                                        />
                                    ) : (
                                        <div className="text-center py-12">
                                            <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pending Debit Notes</h3>
                                            <p className="text-gray-500">All debit notes have been processed.</p>
                                        </div>
                                    )}
                                </TabsContent>
                                
                                {/* HISTORY TAB CONTENT */}
                                <TabsContent value="history" className="m-0">
                                    {historyData.length > 0 ? (
                                        <DataTable
                                            data={historyData}
                                            columns={historyColumns}
                                            searchFields={[
                                                'liftNumber',
                                                'indentNumber',
                                                'productName',
                                                'vendorName',
                                                'status',
                                                'firmNameMatch'
                                            ]}
                                            dataLoading={false}
                                            className="border rounded-lg"
                                        />
                                    ) : (
                                        <div className="text-center py-12">
                                            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No History Available</h3>
                                            <p className="text-gray-500">No debit notes have been sent yet.</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Send Debit Note Dialog */}
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    {selectedItem && (
                        <DialogContent className="sm:max-w-2xl">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                                    <DialogHeader>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <Receipt className="h-6 w-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <DialogTitle className="text-xl">Send Debit Note</DialogTitle>
                                                <DialogDescription>
                                                    Send debit note for Lift: <span className="font-semibold text-purple-600">{selectedItem.liftNumber}</span>
                                                </DialogDescription>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    <Separator />

                                    {/* Item Details Card */}
                                    <Card className="bg-purple-50 border-purple-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-semibold text-purple-800 flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                Item Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Lift Number</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.liftNumber}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Indent Number</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.indentNumber}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Product</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.productName}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Vendor</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.vendorName}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Quantity</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.qty}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Bill Amount</p>
                                                    <p className="text-sm font-semibold text-green-600">
                                                        ₹{selectedItem.billAmount?.toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Reason</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.reason || 'Not specified'}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Form Fields */}
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="debitNoteCopy"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium flex items-center gap-2">
                                                        <Upload className="h-4 w-4" />
                                                        Debit Note Copy (PDF/Image)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-400 transition-colors">
                                                            <Input
                                                                type="file"
                                                                accept="image/*,.pdf"
                                                                className="cursor-pointer border-0"
                                                                onChange={(e) => field.onChange(e.target.files?.[0])}
                                                                disabled={uploadingFile}
                                                            />
                                                            <p className="text-xs text-gray-500 mt-2">
                                                                Upload debit note copy (optional)
                                                            </p>
                                                        </div>
                                                    </FormControl>
                                                    {uploadingFile && (
                                                        <p className="text-sm text-blue-600 flex items-center gap-2">
                                                            <Loader size={16} color="blue" />
                                                            Uploading file...
                                                        </p>
                                                    )}
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        
                                        <FormField
                                            control={form.control}
                                            name="debitNoteNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">Debit Note Number</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="text"
                                                            placeholder="Enter debit note number (e.g., DN-001)"
                                                            className="border-gray-300 focus:border-purple-500"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Separator />

                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button variant="outline" className="border-gray-300" disabled={uploadingFile}>
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button 
                                            type="submit" 
                                            className="bg-purple-600 hover:bg-purple-700 shadow-sm"
                                            disabled={form.formState.isSubmitting || uploadingFile}
                                        >
                                            {form.formState.isSubmitting ? (
                                                <>
                                                    <Loader size={18} className="mr-2" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Receipt className="mr-2 h-4 w-4" />
                                                    Send Debit Note
                                                </>
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    )}
                </Dialog>
            </div>
        </div>
    );
};