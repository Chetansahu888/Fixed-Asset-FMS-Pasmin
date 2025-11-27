import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
    DialogHeader,
    DialogFooter,
    DialogClose,
} from '../ui/dialog';
import { postToSheet, uploadFile } from '@/lib/fetchers';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { PuffLoader as Loader } from 'react-spinners';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ShoppingCart, Building, User, Package, Calendar, Truck, FileText, IndianRupee } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { formatDate } from '@/lib/utils';

interface GetPurchaseData {
    indentNo: string;
    firmNameMatch: string;
    vendorName: string;
    poNumber: string;
    poDate: string;
    deliveryDate: string;
    product?: string;
    quantity?: number;
    pendingLiftQty?: number;
    receivedQty?: number;
    pendingPoQty?: number;
}

interface HistoryData {
    indentNo: string;
    firmNameMatch: string;
    vendorName: string;
    poNumber: string;
    deliveryDate: string;
    poDate: string;
    product?: string;
    quantity?: number;
    pendingLiftQty?: number;
    receivedQty?: number;
    pendingPoQty?: number;
}

interface IndentSheetRecord {
    liftingStatus?: string;
    firmNameMatch?: string;
    indentNumber?: string;
    approvedVendorName?: string;
    poNumber?: string;
    actual4?: string | number | Date;
    planned5?: string | number | Date;
    deliveryDate?: string | number | Date;
    productName?: string;
    pendingLiftQty?: string | number;
    quantity?: string | number;
    approvedQuantity?: string | number;
}

interface StoreInRecord {
    indentNo?: string;
    firmNameMatch?: string;
    vendorName?: string;
    qty?: string | number;
    receivedQuantity?: string | number;
}

interface AuthUser {
    firmNameMatch?: string;
    receiveItemAction?: boolean;
}

export default function GetPurchase() {
    const { indentSheet, indentLoading, updateStoreInSheet, storeInSheet } = useSheets();
    const { user } = useAuth() as { user: AuthUser };
    const [selectedIndent, setSelectedIndent] = useState<GetPurchaseData | null>(null);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [tableData, setTableData] = useState<GetPurchaseData[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [vendorOptions, setVendorOptions] = useState<string[]>([]);
    const [vendorSearch, setVendorSearch] = useState('');

    // Fetch vendor options from MASTER sheet
    useEffect(() => {
        const fetchVendorOptions = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_APP_SCRIPT_URL}?sheetName=MASTER`
                );
                const data = await response.json();
                if (data.success && data.options) {
                    setVendorOptions(data.options.vendorName || []);
                }
            } catch (error) {
                console.error('Failed to fetch vendor options:', error);
                toast.error('Failed to load vendor options');
            }
        };
        
        fetchVendorOptions();
    }, []);

    useEffect(() => {
        const filteredByFirm = indentSheet.filter((sheet: IndentSheetRecord) =>
            user?.firmNameMatch?.toLowerCase() === "all" || sheet.firmNameMatch === user?.firmNameMatch
        );

        setTableData(
            filteredByFirm
                .filter((sheet: IndentSheetRecord) => {
                    return sheet.liftingStatus === 'Pending' && 
                           sheet.planned5 && 
                           sheet.planned5.toString().trim() !== '';
                })
                .map((sheet: IndentSheetRecord) => {
                    const receivedQty = storeInSheet
                        .filter((store: StoreInRecord) => store.indentNo === sheet.indentNumber?.toString())
                        .reduce((sum: number, store: StoreInRecord) => sum + (Number(store.receivedQuantity) || 0), 0);
                    
                    const approvedQty = Number(sheet.approvedQuantity) || Number(sheet.quantity) || 0;
                    const pendingLift = Number(sheet.pendingLiftQty) || approvedQty;
                    
                    return {
                        indentNo: sheet.indentNumber?.toString() || '',
                        firmNameMatch: sheet.firmNameMatch || '',
                        vendorName: sheet.approvedVendorName || '',
                        poNumber: sheet.poNumber || '',
                        poDate: sheet.actual4 ? formatDate(new Date(sheet.actual4)) : '',
                        deliveryDate: sheet.deliveryDate ? formatDate(new Date(sheet.deliveryDate)) : '',
                        product: sheet.productName || '',
                        quantity: approvedQty,
                        pendingLiftQty: pendingLift,
                        receivedQty: receivedQty,
                        pendingPoQty: pendingLift - receivedQty,
                    };
                })
        );
    }, [indentSheet, user?.firmNameMatch, storeInSheet]);

    useEffect(() => {
        const filteredByFirm = indentSheet.filter((sheet: IndentSheetRecord) =>
            user?.firmNameMatch?.toLowerCase() === "all" || sheet.firmNameMatch === user?.firmNameMatch
        );

        const completedIndents = filteredByFirm
            .filter((sheet: IndentSheetRecord) => {
                return sheet.liftingStatus === 'Complete' && 
                       sheet.planned5 && 
                       sheet.planned5.toString().trim() !== '';
            });

        const indentDataMap = new Map(
            completedIndents.map((sheet: any) => [
                sheet.indentNumber?.toString() || '',
                {
                    poNumber: sheet.poNumber || '',
                    poDate: sheet.actual4 ? formatDate(new Date(sheet.actual4)) : '',
                    deliveryDate: sheet.deliveryDate ? formatDate(new Date(sheet.deliveryDate)) : '',
                    approvedVendorName: sheet.approvedVendorName || '',
                    productName: sheet.productName || '',
                    approvedQuantity: sheet.approvedQuantity || sheet.quantity || 0,
                    pendingLiftQty: sheet.pendingLiftQty || 0,
                }
            ])
        );

        setHistoryData(
            storeInSheet
                .filter((sheet: StoreInRecord) => indentDataMap.has(sheet.indentNo || ''))
                .map((sheet: StoreInRecord) => {
                    const indentData = indentDataMap.get(sheet.indentNo || '')!;
                    
                    const indentRecord = completedIndents.find(
                        (indent) => indent.indentNumber?.toString() === sheet.indentNo
                    );
                    
                    const approvedQty = Number(indentRecord?.approvedQuantity) || 
                                       Number(indentRecord?.quantity) || 0;
                    
                    const receivedQty = storeInSheet
                        .filter((store: StoreInRecord) => store.indentNo === sheet.indentNo)
                        .reduce((sum: number, store: StoreInRecord) => 
                            sum + (Number(store.receivedQuantity) || 0), 0);
                    
                    const pendingLift = approvedQty - receivedQty;
                    
                    return {
                        indentNo: sheet.indentNo || '',
                        firmNameMatch: sheet.firmNameMatch || '',
                        vendorName: indentData.approvedVendorName || sheet.vendorName || '',
                        poNumber: indentData.poNumber,
                        poDate: indentData.poDate,
                        deliveryDate: indentData.deliveryDate,
                        product: indentData.productName,
                        quantity: approvedQty,
                        pendingLiftQty: pendingLift,
                        receivedQty: receivedQty,
                        pendingPoQty: Math.max(0, pendingLift),
                    };
                })
                .sort((a, b) => b.indentNo.localeCompare(a.indentNo))
        );
    }, [storeInSheet, indentSheet, user?.firmNameMatch]);

    // Creating table columns with enhanced styling
    const columns: ColumnDef<GetPurchaseData>[] = [
        ...(user?.receiveItemAction
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<GetPurchaseData> }) => {
                        const indent = row.original;
                        return (
                            <div className="flex justify-center">
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedIndent(indent);
                                            setOpenDialog(true);
                                        }}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 font-semibold rounded-lg shadow-md"
                                    >
                                        Update
                                    </Button>
                                </DialogTrigger>
                            </div>
                        );
                    },
                },
            ]
            : []),
        {
            accessorKey: 'indentNo',
            header: 'Indent No.',
            cell: ({ getValue }) => (
                <div className="text-center font-bold text-blue-700">
                    {getValue() as string || '-'}
                </div>
            )
        },
        {
            accessorKey: 'firmNameMatch',
            header: 'Firm Name',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Building className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string || '-'}
                </div>
            )
        },
        {
            accessorKey: 'vendorName',
            header: 'Vendor Name',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <User className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string || '-'}
                </div>
            )
        },
        {
            accessorKey: 'poNumber',
            header: 'PO Number',
            cell: ({ getValue }) => (
                <div className="text-center font-semibold text-green-700">
                    {getValue() as string || '-'}
                </div>
            )
        },
        {
            accessorKey: 'poDate',
            header: 'PO Date',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Calendar className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string || '-'}
                </div>
            )
        },
        {
            accessorKey: 'deliveryDate',
            header: 'Delivery Date',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Calendar className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string || '-'}
                </div>
            )
        },
        {
            accessorKey: 'pendingLiftQty',
            header: 'Pending Lift Qty',
            cell: ({ getValue }) => (
                <div className="text-center font-semibold text-orange-600">
                    {getValue() as number || 0}
                </div>
            )
        },
        {
            accessorKey: 'receivedQty',
            header: 'Received Qty',
            cell: ({ getValue }) => (
                <div className="text-center font-semibold text-green-600">
                    {getValue() as number || 0}
                </div>
            )
        },
        {
            accessorKey: 'pendingPoQty',
            header: 'Pending PO Qty',
            cell: ({ getValue }) => (
                <div className="text-center font-semibold text-red-600">
                    {getValue() as number || 0}
                </div>
            )
        },
    ];

    const historyColumns: ColumnDef<HistoryData>[] = [
        {
            accessorKey: 'indentNo',
            header: 'Indent No.',
            cell: ({ getValue }) => (
                <div className="text-center font-bold text-blue-700">
                    {getValue() as string || '-'}
                </div>
            )
        },
        {
            accessorKey: 'firmNameMatch',
            header: 'Firm Name',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Building className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string || '-'}
                </div>
            )
        },
        {
            accessorKey: 'vendorName',
            header: 'Vendor Name',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <User className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string || '-'}
                </div>
            )
        },
        {
            accessorKey: 'poNumber',
            header: 'PO Number',
            cell: ({ getValue }) => (
                <div className="text-center font-semibold text-green-700">
                    {getValue() as string || '-'}
                </div>
            )
        },
        {
            accessorKey: 'poDate',
            header: 'PO Date',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Calendar className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string || '-'}
                </div>
            )
        },
        {
            accessorKey: 'deliveryDate',
            header: 'Delivery Date',
            cell: ({ getValue }) => (
                <div className="text-center">
                    <Calendar className="inline mr-2 h-4 w-4 text-gray-600" />
                    {getValue() as string || '-'}
                </div>
            )
        },
        {
            accessorKey: 'pendingLiftQty',
            header: 'Pending Lift Qty',
            cell: ({ getValue }) => (
                <div className="text-center font-semibold text-orange-600">
                    {getValue() as number || 0}
                </div>
            )
        },
        {
            accessorKey: 'receivedQty',
            header: 'Received Qty',
            cell: ({ getValue }) => (
                <div className="text-center font-semibold text-green-600">
                    {getValue() as number || 0}
                </div>
            )
        },
        {
            accessorKey: 'pendingPoQty',
            header: 'Pending PO Qty',
            cell: ({ getValue }) => (
                <div className="text-center font-semibold text-red-600">
                    {getValue() as number || 0}
                </div>
            )
        },
    ];

    // Creating form schema
    const formSchema = z.object({
        billStatus: z.string().min(1, 'Bill status is required'),
        billNo: z.string().optional(),
        qty: z.coerce.number().optional(),
        leadTime: z.string().optional(),
        typeOfBill: z.string().optional(),
        billAmount: z.coerce.number().optional(),
        discountAmount: z.coerce.number().optional(),
        paymentType: z.string().optional(),
        advanceAmount: z.coerce.number().optional(),
        photoOfBill: z.instanceof(File).optional(),
        billRemark: z.string().optional(),
        vendorName: z.string().optional(),
        transportationInclude: z.string().optional(),
        transporterName: z.string().optional(),
        vehicleNo: z.string().optional(),
        driverName: z.string().optional(),
        driverMobileNo: z.string().optional(),
        amount: z.coerce.number().optional(),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            billStatus: '',
            billNo: '',
            qty: 0,
            leadTime: '',
            typeOfBill: '',
            billAmount: 0,
            discountAmount: 0,
            paymentType: '',
            advanceAmount: 0,
            billRemark: '',
            vendorName: '',
            transportationInclude: '',
            transporterName: '',
            vehicleNo: '',
            driverName: '',
            driverMobileNo: '',
            amount: 0,
        },
    });

    const billStatus = form.watch('billStatus');
    const typeOfBill = form.watch('typeOfBill');

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            let photoUrl = '';
            if (values.photoOfBill) {
                photoUrl = await uploadFile({
                    file: values.photoOfBill,
                    folderId: import.meta.env.VITE_BILL_PHOTO_FOLDER || 'bill-photos'
                });
            }

            const newStoreInRecord = {
                timestamp: new Date().toISOString(),
                indentNo: selectedIndent?.indentNo || '',
                poNumber: selectedIndent?.poNumber || '',
                vendorName: values.vendorName || '',
                productName: selectedIndent?.product || '',
                billStatus: values.billStatus,
                billNo: values.billNo || '',
                qty: values.qty || selectedIndent?.quantity || 0,
                leadTimeToLiftMaterial: Number(values.leadTime) || 0,
                typeOfBill: values.typeOfBill || '',
                billAmount: values.billAmount || 0,
                discountAmount: values.discountAmount || 0,
                paymentType: values.paymentType || '',
                advanceAmountIfAny: values.advanceAmount || 0,
                photoOfBill: photoUrl,
                billRemark: values.billRemark || '',
                transportationInclude: values.transportationInclude || '',
                transporterName: values.transporterName || '',
                vehicleNo: values.vehicleNo || '',
                driverName: values.driverName || '',
                driverMobileNo: values.driverMobileNo || '',
                amount: values.amount || 0,
            };

            await postToSheet([newStoreInRecord], 'insert', 'STORE IN');

            toast.success(`Created store record for ${selectedIndent?.indentNo}`);
            setOpenDialog(false);
            form.reset();
            setTimeout(() => updateStoreInSheet(), 1000);
        } catch {
            toast.error('Failed to create store record');
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
            <div className="max-w-7xl mx-auto">
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <Tabs defaultValue="pending">
                        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 mb-6">
                            <Heading
                                heading="Get Purchase"
                                subtext="Manage purchase bill details and status"
                                tabs
                            >
                                <ShoppingCart size={50} className="text-blue-600" />
                            </Heading>

                            <TabsContent value="pending" className="mt-0">
                                <DataTable
                                    data={tableData}
                                    columns={columns}
                                    searchFields={['indentNo', 'vendorName', 'poNumber', 'firmNameMatch']}
                                    dataLoading={indentLoading}
                                />
                            </TabsContent>
                            <TabsContent value="history" className="mt-0">
                                <DataTable
                                    data={historyData}
                                    columns={historyColumns}
                                    searchFields={['indentNo', 'vendorName', 'poNumber', 'firmNameMatch']}
                                    dataLoading={false}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>

                    {selectedIndent && (
                        <DialogContent className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl max-w-4xl">
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit, onError)}
                                    className="space-y-6 p-6 max-h-[80vh] overflow-y-auto"
                                >
                                    <DialogHeader className="text-center">
                                        <DialogTitle className="text-2xl font-bold text-gray-800">
                                            Update Purchase Details
                                        </DialogTitle>
                                        <DialogDescription className="text-lg text-gray-600">
                                            Update purchase details for{' '}
                                            <span className="font-bold text-blue-600">
                                                {selectedIndent.indentNo}
                                            </span>
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gradient-to-r from-blue-50 to-green-50 py-4 px-6 rounded-xl border-2 border-gray-200">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Indent Number</p>
                                            <p className="text-sm font-light bg-white px-2 py-1 rounded border">
                                                {selectedIndent.indentNo}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Product</p>
                                            <p className="text-sm font-light bg-white px-2 py-1 rounded border">
                                                {selectedIndent.product || '-'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">PO Number</p>
                                            <p className="text-sm font-light bg-white px-2 py-1 rounded border">
                                                {selectedIndent.poNumber}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Pending Lift Qty</p>
                                            <p className="text-sm font-light bg-white px-2 py-1 rounded border">
                                                {selectedIndent.quantity || 0}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Qty</p>
                                            <p className="text-sm font-light bg-white px-2 py-1 rounded border">
                                                {storeInSheet
                                                    .find((sheet: StoreInRecord) => sheet.indentNo === selectedIndent.indentNo)?.qty || 0}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-gray-700">Received Quantity</p>
                                            <p className="text-sm font-light bg-white px-2 py-1 rounded border">
                                                {storeInSheet
                                                    .find((sheet: StoreInRecord) => sheet.indentNo === selectedIndent.indentNo)?.receivedQuantity || 0}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        <FormField
                                            control={form.control}
                                            name="billStatus"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-semibold text-gray-700 text-lg">Bill Status *</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl">
                                                                <SelectValue placeholder="Select bill status" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Bill Received">
                                                                Bill Received
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />

                                        {billStatus === 'Bill Received' && (
                                            <FormField
                                                control={form.control}
                                                name="billNo"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-semibold text-gray-700">Bill No. *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter bill number"
                                                                {...field}
                                                                className="h-12 border-2 border-gray-300 rounded-xl"
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {billStatus && (
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name="qty"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold text-gray-700">Qty</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Enter quantity"
                                                                    {...field}
                                                                    className="h-12 border-2 border-gray-300 rounded-xl"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="leadTime"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold text-gray-700">
                                                                Lead Time To Lift Material *
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter lead time"
                                                                    {...field}
                                                                    className="h-12 border-2 border-gray-300 rounded-xl"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="vendorName"
                                                    render={({ field }) => {
                                                        const filteredVendors = vendorOptions.filter(vendor =>
                                                            vendor.toLowerCase().includes(vendorSearch.toLowerCase())
                                                        );
                                                        
                                                        return (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold text-gray-700">Vendor Name</FormLabel>
                                                                <Select
                                                                    onValueChange={(value) => {
                                                                        field.onChange(value);
                                                                        setVendorSearch('');
                                                                    }}
                                                                    value={field.value}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl">
                                                                            <SelectValue placeholder="Select vendor name" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className="max-h-[300px]">
                                                                        <div className="sticky top-0 bg-white p-2 border-b z-10">
                                                                            <Input
                                                                                placeholder="Search vendor..."
                                                                                value={vendorSearch}
                                                                                onChange={(e) => setVendorSearch(e.target.value)}
                                                                                className="h-8 border-2 border-gray-300 rounded-lg"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            />
                                                                        </div>
                                                                        {filteredVendors.length > 0 ? (
                                                                            filteredVendors.map((vendor) => (
                                                                                <SelectItem key={vendor} value={vendor}>
                                                                                    {vendor}
                                                                                </SelectItem>
                                                                            ))
                                                                        ) : (
                                                                            <div className="text-sm text-gray-500 text-center py-2">
                                                                                No vendor found
                                                                            </div>
                                                                        )}
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormItem>
                                                        );
                                                    }}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="transportationInclude"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold text-gray-700">Transportation Include</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl">
                                                                        <SelectValue placeholder="Select transportation" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="Yes">Yes</SelectItem>
                                                                    <SelectItem value="No">No</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="transporterName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold text-gray-700">Transporter Name</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter transporter name"
                                                                    {...field}
                                                                    disabled={form.watch("transportationInclude") !== "Yes"}
                                                                    className="h-12 border-2 border-gray-300 rounded-xl"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="vehicleNo"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold text-gray-700">Vehicle No.</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter Vehicle No."
                                                                    {...field}
                                                                    disabled={form.watch("transportationInclude") !== "Yes"}
                                                                    className="h-12 border-2 border-gray-300 rounded-xl"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="driverName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold text-gray-700">Driver Name</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter Driver name"
                                                                    {...field}
                                                                    disabled={form.watch("transportationInclude") !== "Yes"}
                                                                    className="h-12 border-2 border-gray-300 rounded-xl"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="driverMobileNo"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold text-gray-700">Driver Mobile No.</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Enter Driver Mobile No."
                                                                    {...field}
                                                                    disabled={form.watch("transportationInclude") !== "Yes"}
                                                                    className="h-12 border-2 border-gray-300 rounded-xl"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="amount"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold text-gray-700">Amount</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Enter amount"
                                                                    {...field}
                                                                    disabled={form.watch("transportationInclude") !== "Yes"}
                                                                    className="h-12 border-2 border-gray-300 rounded-xl"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="billRemark"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold text-gray-700">Bill Remark</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter bill remark"
                                                                    {...field}
                                                                    className="h-12 border-2 border-gray-300 rounded-xl"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="typeOfBill"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold text-gray-700">Type Of Bill *</FormLabel>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                value={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl">
                                                                        <SelectValue placeholder="Select type of bill" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="independent">Independent</SelectItem>
                                                                    <SelectItem value="common">Common</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />

                                                {typeOfBill === 'independent' && (
                                                    <>
                                                        <FormField
                                                            control={form.control}
                                                            name="billAmount"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="font-semibold text-gray-700">Bill Amount *</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="Enter bill amount"
                                                                            {...field}
                                                                            className="h-12 border-2 border-gray-300 rounded-xl"
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="discountAmount"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="font-semibold text-gray-700">Discount Amount</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="Enter discount amount"
                                                                            {...field}
                                                                            className="h-12 border-2 border-gray-300 rounded-xl"
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="paymentType"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="font-semibold text-gray-700">Payment Type</FormLabel>
                                                                    <Select
                                                                        onValueChange={field.onChange}
                                                                        value={field.value}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl">
                                                                                <SelectValue placeholder="Select payment type" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="Advance">Advance</SelectItem>
                                                                            <SelectItem value="Credit">Credit</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="advanceAmount"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="font-semibold text-gray-700">Advance Amount If Any</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="Enter advance amount"
                                                                            {...field}
                                                                            className="h-12 border-2 border-gray-300 rounded-xl"
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="photoOfBill"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="font-semibold text-gray-700">Photo Of Bill</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={(e) =>
                                                                                field.onChange(
                                                                                    e.target.files?.[0]
                                                                                )
                                                                            }
                                                                            className="border-2 border-gray-300 rounded-xl py-3"
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <DialogFooter className="flex justify-center gap-4 pt-6">
                                        <DialogClose asChild>
                                            <Button 
                                                variant="outline" 
                                                className="border-2 border-gray-300 rounded-xl px-8 py-3 text-lg font-semibold"
                                            >
                                                Close
                                            </Button>
                                        </DialogClose>
                                        <Button 
                                            type="submit" 
                                            disabled={form.formState.isSubmitting}
                                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl px-8 py-3 text-lg font-semibold border-0"
                                        >
                                            {form.formState.isSubmitting && (
                                                <Loader
                                                    size={20}
                                                    color="white"
                                                    aria-label="Loading Spinner"
                                                    className="mr-2"
                                                />
                                            )}
                                            Update Purchase
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
}