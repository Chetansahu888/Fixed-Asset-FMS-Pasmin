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
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { formatDate } from '@/lib/utils';

interface GetPurchaseData {
    indentNo: string;
    firmNameMatch: string;
    vendorName: string;
    poNumber: string;
    poDate: string;
    deliveryDate: string;  // ✅ Changed from plannedDate
    product?: string;
    quantity?: number;
    pendingLiftQty?: number;  // ✅ NEW
    receivedQty?: number;     // ✅ NEW
    pendingPoQty?: number;    // ✅ NEW
}
interface HistoryData {
    indentNo: string;
    firmNameMatch: string;
    vendorName: string;
    poNumber: string;
    poDate: string;
    deliveryDate: string;
    product?: string;          // ✅ NEW
    quantity?: number;         // ✅ NEW
    pendingLiftQty?: number;  // ✅ NEW
    receivedQty?: number;     // ✅ NEW
    pendingPoQty?: number;    // ✅ NEW
}


interface IndentSheetRecord {
    liftingStatus?: string;
    firmNameMatch?: string;
    indentNumber?: string;
    approvedVendorName?: string;
    poNumber?: string;
    actual4?: string | number | Date;
    planned5?: string | number | Date;
    deliveryDate?: string | number | Date;  // ✅ NEW: Add delivery date from header
    productName?: string;
    pendingLiftQty?: string | number;
    quantity?: string | number;
    approvedQuantity?: string | number;  // ✅ NEW
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
            // ✅ Calculate received qty from storeInSheet
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
                deliveryDate: sheet.deliveryDate ? formatDate(new Date(sheet.deliveryDate)) : '',  // ✅ Changed
                product: sheet.productName || '',
                quantity: approvedQty,
                pendingLiftQty: pendingLift,          // ✅ NEW
                receivedQty: receivedQty,             // ✅ NEW
                pendingPoQty: pendingLift - receivedQty,  // ✅ NEW: Pending = PendingLift - Received
            };
        })
);

    }, [indentSheet, user?.firmNameMatch]);

    useEffect(() => {
        const filteredByFirm = indentSheet.filter((sheet: IndentSheetRecord) =>
            user?.firmNameMatch?.toLowerCase() === "all" || sheet.firmNameMatch === user?.firmNameMatch
        );

        // Get completed indent numbers with their data
        const completedIndents = filteredByFirm
            .filter((sheet: IndentSheetRecord) => {
                return sheet.liftingStatus === 'Complete' && 
                       sheet.planned5 && 
                       sheet.planned5.toString().trim() !== '';
            });

        // Create a map of indent data for quick lookup
       // Update the indentDataMap to include all required fields
// Define interface for better type safety
interface SheetData {
    indentNumber?: string | number;
    poNumber?: string;
    actual4?: string | Date;
    deliveryDate?: string | Date | null;
    approvedVendorName?: string;
    productName?: string;
    approvedQuantity?: number;
    quantity?: number;
    pendingLiftQty?: number;
}

const indentDataMap = new Map(
    completedIndents.map((sheet: SheetData) => [
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
            
            // ✅ FIX: Get the correct approved quantity from indent sheet
            const indentRecord = completedIndents.find(
                (indent) => indent.indentNumber?.toString() === sheet.indentNo
            );
            
            const approvedQty = Number(indentRecord?.approvedQuantity) || 
                               Number(indentRecord?.quantity) || 0;
            
            // ✅ Calculate total received qty for this indent
            const receivedQty = storeInSheet
                .filter((store: StoreInRecord) => store.indentNo === sheet.indentNo)
                .reduce((sum: number, store: StoreInRecord) => 
                    sum + (Number(store.receivedQuantity) || 0), 0);
            
            // ✅ FIX: Use actual approved quantity, not pendingLiftQty from map
            const pendingLift = approvedQty - receivedQty; // ✅ This is the correct calculation
            
            return {
                indentNo: sheet.indentNo || '',
                firmNameMatch: sheet.firmNameMatch || '',
                vendorName: indentData.approvedVendorName || sheet.vendorName || '',
                poNumber: indentData.poNumber,
                poDate: indentData.poDate,
                deliveryDate: indentData.deliveryDate,
                product: indentData.productName,
                quantity: approvedQty,                    // ✅ Total approved qty
                pendingLiftQty: pendingLift,              // ✅ Remaining to lift
                receivedQty: receivedQty,                 // ✅ Already received
                pendingPoQty: Math.max(0, pendingLift),   // ✅ Can't be negative
            };
        })
        .sort((a, b) => b.indentNo.localeCompare(a.indentNo))
);


    }, [storeInSheet, indentSheet, user?.firmNameMatch]);

    // Creating table columns
    const columns: ColumnDef<GetPurchaseData>[] = [
        ...(user?.receiveItemAction
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<GetPurchaseData> }) => {
                        const indent = row.original;
                        return (
                            <div>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedIndent(indent);
                                        }}
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
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'firmNameMatch',
            header: 'Firm Name',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'vendorName',
            header: 'Approved Vendor Name',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'poNumber',
            header: 'PO Number',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        {
            accessorKey: 'poDate',
            header: 'PO Date',
            cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
        },
        {
        accessorKey: 'deliveryDate',  // ✅ Changed from plannedDate
        header: 'Delivery Date',      // ✅ Changed header
        cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
    },
    {
        accessorKey: 'pendingLiftQty',  // ✅ NEW
        header: 'Pending Lift Qty',
        cell: ({ getValue }) => <div>{getValue() as number || 0}</div>
    },
    {
        accessorKey: 'receivedQty',  // ✅ NEW
        header: 'Received Qty',
        cell: ({ getValue }) => <div>{getValue() as number || 0}</div>
    },
    {
        accessorKey: 'pendingPoQty',  // ✅ NEW
        header: 'Pending PO Qty',
        cell: ({ getValue }) => <div>{getValue() as number || 0}</div>
    },
    ];

    const historyColumns: ColumnDef<HistoryData>[] = [
    {
        accessorKey: 'indentNo',
        header: 'Indent No.',
        cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
    },
    {
        accessorKey: 'firmNameMatch',
        header: 'Firm Name',
        cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
    },
    {
        accessorKey: 'vendorName',
        header: 'Approved Vendor Name',
        cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
    },
    {
        accessorKey: 'poNumber',
        header: 'PO Number',
        cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
    },
    {
        accessorKey: 'poDate',
        header: 'PO Date',
        cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
    },
    {
        accessorKey: 'deliveryDate',  // ✅ Changed from plannedDate
        header: 'Delivery Date',
        cell: ({ getValue }) => <div>{getValue() as string || '-'}</div>
    },
    {
        accessorKey: 'pendingLiftQty',  // ✅ NEW (same as pending tab)
        header: 'Pending Lift Qty',
        cell: ({ getValue }) => <div>{getValue() as number || 0}</div>
    },
    {
        accessorKey: 'receivedQty',  // ✅ NEW (same as pending tab)
        header: 'Received Qty',
        cell: ({ getValue }) => <div>{getValue() as number || 0}</div>
    },
    {
        accessorKey: 'pendingPoQty',  // ✅ NEW (same as pending tab)
        header: 'Pending PO Qty',
        cell: ({ getValue }) => <div>{getValue() as number || 0}</div>
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

            // Create new record for storeInSheet
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
        <div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Tabs defaultValue="pending">
                    <Heading
                        heading="Get Purchase"
                        subtext="Manage purchase bill details and status"
                        tabs
                    >
                        <ShoppingCart size={50} className="text-primary" />
                    </Heading>

                    <TabsContent value="pending">
                        <DataTable
                            data={tableData}
                            columns={columns}
                            searchFields={['indentNo', 'vendorName', 'poNumber', 'firmNameMatch']}
                            dataLoading={indentLoading}
                        />
                    </TabsContent>
                    <TabsContent value="history">
                        <DataTable
                            data={historyData}
                            columns={historyColumns}
                            searchFields={['indentNo', 'vendorName', 'poNumber', 'firmNameMatch']}
                            dataLoading={false}
                        />
                    </TabsContent>
                </Tabs>

                {selectedIndent && (
                    <DialogContent className="max-w-2xl">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit, onError)}
                                className="space-y-5"
                            >
                                <DialogHeader className="space-y-1">
                                    <DialogTitle>Update Purchase Details</DialogTitle>
                                    <DialogDescription>
                                        Update purchase details for{' '}
                                        <span className="font-medium">
                                            {selectedIndent.indentNo}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-muted py-2 px-5 rounded-md">
                                    <div className="space-y-1">
                                        <p className="font-medium">Indent Number</p>
                                        <p className="text-sm font-light">
                                            {selectedIndent.indentNo}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">Product</p>
                                        <p className="text-sm font-light">
                                            {selectedIndent.product || '-'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">PO Number</p>
                                        <p className="text-sm font-light">
                                            {selectedIndent.poNumber}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">Pending Lift Qty</p>
                                        <p className="text-sm font-light">
                                            {selectedIndent.quantity || 0}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">Qty</p>
                                        <p className="text-sm font-light">
                                            {storeInSheet
                                                .find((sheet: StoreInRecord) => sheet.indentNo === selectedIndent.indentNo)?.qty || 0}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">Received Quantity</p>
                                        <p className="text-sm font-light">
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
                                                <FormLabel>Bill Status *</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select bill status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Bill Received">
                                                            Bill Received
                                                        </SelectItem>
                                                        <SelectItem value="Bill Not Received">
                                                            Bill Not Received
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
                                                    <FormLabel>Bill No. *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter bill number"
                                                            {...field}
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
                                                        <FormLabel>Qty</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="Enter quantity"
                                                                {...field}
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
                                                        <FormLabel>
                                                            Lead Time To Lift Material *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter lead time"
                                                                {...field}
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
                <FormLabel>Vendor Name</FormLabel>
                <Select
                    onValueChange={(value) => {
                        field.onChange(value);
                        setVendorSearch(''); // Reset search after selection
                    }}
                    value={field.value}
                >
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select vendor name" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                        <div className="sticky top-0 bg-white p-2 border-b z-10">
                            <Input
                                placeholder="Search vendor..."
                                value={vendorSearch}
                                onChange={(e) => setVendorSearch(e.target.value)}
                                className="h-8"
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
                                                        <FormLabel>Transportation Include</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
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
                                                        <FormLabel>Transporter Name</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter transporter name"
                                                                {...field}
                                                                disabled={form.watch("transportationInclude") !== "Yes"}
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
                                                        <FormLabel>Vehical No.</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter Vehical No."
                                                                {...field}
                                                                disabled={form.watch("transportationInclude") !== "Yes"}
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
                                                        <FormLabel>Driver Name</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter Driver name"
                                                                {...field}
                                                                disabled={form.watch("transportationInclude") !== "Yes"}
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
                                                        <FormLabel>Driver Mobile No.</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="Enter Driver Mobile No."
                                                                {...field}
                                                                disabled={form.watch("transportationInclude") !== "Yes"}
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
                                                        <FormLabel>Amount</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="Enter amount"
                                                                {...field}
                                                                disabled={form.watch("transportationInclude") !== "Yes"}
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
                                                        <FormLabel>Bill Remark</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter bill remark"
                                                                {...field}
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
                                                        <FormLabel>Type Of Bill *</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select type of bill" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="independent">
                                                                    Independent
                                                                </SelectItem>
                                                                <SelectItem value="common">
                                                                    Common
                                                                </SelectItem>
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
                                                                <FormLabel>Bill Amount *</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Enter bill amount"
                                                                        {...field}
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
                                                                <FormLabel>
                                                                    Discount Amount
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Enter discount amount"
                                                                        {...field}
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
                                                                <FormLabel>Payment Type</FormLabel>
                                                                <Select
                                                                    onValueChange={field.onChange}
                                                                    value={field.value}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Select payment type" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="Advance">
                                                                            Advance
                                                                        </SelectItem>
                                                                        <SelectItem value="Credit">
                                                                            Credit
                                                                        </SelectItem>
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
                                                                <FormLabel>
                                                                    Advance Amount If Any
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Enter advance amount"
                                                                        {...field}
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
                                                                <FormLabel>Photo Of Bill</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={(e) =>
                                                                            field.onChange(
                                                                                e.target.files?.[0]
                                                                            )
                                                                        }
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

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Close</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting && (
                                            <Loader
                                                size={20}
                                                color="white"
                                                aria-label="Loading Spinner"
                                            />
                                        )}
                                        Update
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}