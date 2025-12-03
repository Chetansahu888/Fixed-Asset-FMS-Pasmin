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
    DialogTrigger,
    DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { PuffLoader as Loader } from 'react-spinners';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { postToSheet } from '@/lib/fetchers';
import { RefreshCw, Package, Clock, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { Pill } from '../ui/pill';
import { Card } from '../ui/card';

interface ExchangePendingData {
    timestamp: string;
    liftNumber: string;
    indentNo: string;
    poNumber: string;
    vendorName: string;
    productName: string;
    billStatus: string;
    billNo: string;
    qty: number;
    leadTimeToLiftMaterial: string | number;
    typeOfBill: string;
    billAmount: number;
    discountAmount: number;
    paymentType: string;
    advanceAmountIfAny: number;
    photoOfBill: string;
    transportationInclude: string;
    transporterName: string;
    amount: number;
    receivingStatus: string;
    receivedQuantity: number;
    photoOfProduct: string;
    warrenty: string;
    endDateWarrenty: string;
    billReceived: string;
    billNumber: string;
    billAmount2: string;
    billImage: string;
    damageOrder: string;
    quantityAsPerBill: number;
    priceAsPerPo: number;
    remark: string;
    status: string;
    exchangeQty: string | number;
    reason: string;
    billNumber2: string;
    planned10: string;
    actual10: string;
    firmNameMatch: string;
}

interface ExchangeHistoryData {
    timestamp: string;
    liftNumber: string;
    indentNo: string;
    poNumber: string;
    vendorName: string;
    productName: string;
    billStatus: string;
    billNo: string;
    qty: number;
    leadTimeToLiftMaterial: string | number;
    typeOfBill: string;
    billAmount: number;
    discountAmount: number;
    paymentType: string;
    advanceAmountIfAny: number;
    photoOfBill: string;
    transportationInclude: string;
    transporterName: string;
    amount: number;
    receivingStatus: string;
    receivedQuantity: number;
    photoOfProduct: string;
    warrenty: string;
    endDateWarrenty: string;
    billReceived: string;
    billNumber: string;
    billAmount2: string;
    billImage: string;
    damageOrder: string;
    quantityAsPerBill: number;
    priceAsPerPo: number;
    remark: string;
    status: string;
    exchangeQty: string | number;
    reason: string;
    billNumber2: string;
    planned10: string;
    actual10: string;
    firmNameMatch: string;
}

const Exchange = () => {
    const { storeInSheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [pendingData, setPendingData] = useState<ExchangePendingData[]>([]);
    const [historyData, setHistoryData] = useState<ExchangeHistoryData[]>([]);
    const [selectedItem, setSelectedItem] = useState<ExchangePendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    useEffect(() => {
        const filteredByFirm = storeInSheet.filter(item =>
            user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );

        setPendingData(
            filteredByFirm
                .filter((i) =>
                    i.planned10 && i.planned10 !== '' &&
                    (!i.actual10 || i.actual10 === '')
                )
                .map((i) => ({
                    timestamp: i.timestamp || '',
                    liftNumber: i.liftNumber || '',
                    indentNo: i.indentNo || '',
                    poNumber: i.poNumber || '',
                    vendorName: i.vendorName || '',
                    productName: i.productName || '',
                    billStatus: i.billStatus || '',
                    billNo: i.billNo || '',
                    qty: i.qty || 0,
                    leadTimeToLiftMaterial: (i.leadTimeToLiftMaterial || '') as string | number,
                    typeOfBill: i.typeOfBill || '',
                    billAmount: i.billAmount || 0,
                    discountAmount: i.discountAmount || 0,
                    paymentType: i.paymentType || '',
                    advanceAmountIfAny: i.advanceAmountIfAny || 0,
                    photoOfBill: i.photoOfBill || '',
                    transportationInclude: i.transportationInclude || '',
                    transporterName: i.transporterName || '',
                    amount: i.amount || 0,
                    receivingStatus: i.receivingStatus || '',
                    receivedQuantity: i.receivedQuantity || 0,
                    photoOfProduct: i.photoOfProduct || '',
                    warrenty: i.warrenty || '',
                    endDateWarrenty: i.endDateWarrenty || '',
                    billReceived: i.billReceived || '',
                    billNumber: i.billNumber || '',
                    billAmount2: i.billAmount2 || '',
                    billImage: i.billImage || '',
                    damageOrder: i.damageOrder || '',
                    quantityAsPerBill: i.quantityAsPerBill || 0,
                    priceAsPerPo: i.priceAsPerPo || 0,
                    remark: i.remark || '',
                    status: i.status || '',
                    exchangeQty: (i.exchangeQty || 0) as string | number,
                    reason: i.reason || '',
                    billNumber2: i.billNumber2 || '',
                    planned10: i.planned10 || '',
                    actual10: i.actual10 || '',
                    firmNameMatch: i.firmNameMatch || '',
                } as ExchangePendingData))
        );
    }, [storeInSheet, user.firmNameMatch]);

    useEffect(() => {
        const filteredByFirm = storeInSheet.filter(item =>
            user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );

        setHistoryData(
            filteredByFirm
                .filter((i) =>
                    i.actual10 && i.actual10 !== ''
                )
                .map((i) => ({
                    timestamp: i.timestamp || '',
                    liftNumber: i.liftNumber || '',
                    indentNo: i.indentNo || '',
                    poNumber: i.poNumber || '',
                    vendorName: i.vendorName || '',
                    productName: i.productName || '',
                    firmNameMatch: i.firmNameMatch || '',
                    billStatus: i.billStatus || '',
                    billNo: i.billNo || '',
                    qty: i.qty || 0,
                    leadTimeToLiftMaterial: (i.leadTimeToLiftMaterial || '') as string | number,
                    typeOfBill: i.typeOfBill || '',
                    billAmount: i.billAmount || 0,
                    discountAmount: i.discountAmount || 0,
                    paymentType: i.paymentType || '',
                    advanceAmountIfAny: i.advanceAmountIfAny || 0,
                    photoOfBill: i.photoOfBill || '',
                    transportationInclude: i.transportationInclude || '',
                    transporterName: i.transporterName || '',
                    amount: i.amount || 0,
                    receivingStatus: i.receivingStatus || '',
                    receivedQuantity: i.receivedQuantity || 0,
                    photoOfProduct: i.photoOfProduct || '',
                    warrenty: i.warrenty || '',
                    endDateWarrenty: i.endDateWarrenty || '',
                    billReceived: i.billReceived || '',
                    billNumber: i.billNumber || '',
                    billAmount2: i.billAmount2 || '',
                    billImage: i.billImage || '',
                    damageOrder: i.damageOrder || '',
                    quantityAsPerBill: i.quantityAsPerBill || 0,
                    priceAsPerPo: i.priceAsPerPo || 0,
                    remark: i.remark || '',
                    status: i.status || '',
                    exchangeQty: (i.exchangeQty || 0) as string | number,
                    reason: i.reason || '',
                    billNumber2: i.billNumber2 || '',
                    planned10: i.planned10 || '',
                    actual10: i.actual10 || '',
                } as ExchangeHistoryData))
        );
    }, [storeInSheet, user.firmNameMatch]);

    const pendingColumns: ColumnDef<ExchangePendingData>[] = [
        ...(user.receiveItemView
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<ExchangePendingData> }) => {
                        const item = row.original;

                        return (
                            <DialogTrigger asChild>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="font-medium"
                                    onClick={() => {
                                        setSelectedItem(item);
                                    }}
                                >
                                    <Package className="mr-2 h-4 w-4" />
                                    Process
                                </Button>
                            </DialogTrigger>
                        );
                    },
                },
            ]
            : []),
        { accessorKey: 'liftNumber', header: 'Lift Number' },
        { accessorKey: 'indentNo', header: 'Indent No.' },
        { accessorKey: 'poNumber', header: 'PO Number' },
        { accessorKey: 'vendorName', header: 'Vendor Name' },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        { accessorKey: 'productName', header: 'Product Name' },
        { accessorKey: 'billStatus', header: 'Bill Status' },
        { accessorKey: 'billNo', header: 'Bill No.' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'leadTimeToLiftMaterial', header: 'Lead Time' },
        { accessorKey: 'typeOfBill', header: 'Type Of Bill' },
        { accessorKey: 'billAmount', header: 'Bill Amount' },
        { accessorKey: 'discountAmount', header: 'Discount' },
        { accessorKey: 'paymentType', header: 'Payment Type' },
        { accessorKey: 'advanceAmountIfAny', header: 'Advance Amount' },
        {
            accessorKey: 'photoOfBill',
            header: 'Bill Photo',
            cell: ({ row }: { row: Row<ExchangePendingData> }) => {
                const photo = row.original.photoOfBill;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Bill
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { accessorKey: 'transportationInclude', header: 'Transportation' },
        { accessorKey: 'transporterName', header: 'Transporter' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'receivingStatus', header: 'Receiving Status' },
        { accessorKey: 'receivedQuantity', header: 'Received Qty' },
        {
            accessorKey: 'photoOfProduct',
            header: 'Product Photo',
            cell: ({ row }: { row: Row<ExchangePendingData> }) => {
                const photo = row.original.photoOfProduct;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Product
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { accessorKey: 'warrenty', header: 'Warranty' },
        { accessorKey: 'endDateWarrenty', header: 'Warranty End' },
        { accessorKey: 'billReceived', header: 'Bill Received' },
        { accessorKey: 'billNumber', header: 'Bill Number' },
        { accessorKey: 'billAmount2', header: 'Bill Amount' },
        {
            accessorKey: 'billImage',
            header: 'Bill Image',
            cell: ({ row }: { row: Row<ExchangePendingData> }) => {
                const photo = row.original.billImage;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Image
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { accessorKey: 'damageOrder', header: 'Damage Order' },
        { accessorKey: 'quantityAsPerBill', header: 'Qty (Bill)' },
        { accessorKey: 'priceAsPerPo', header: 'Price (PO)' },
        { accessorKey: 'remark', header: 'Remark' },
        { accessorKey: 'status', header: 'Status' },
        { accessorKey: 'exchangeQty', header: 'Exchange Qty' },
        { accessorKey: 'reason', header: 'Reason' },
        { accessorKey: 'billNumber2', header: 'Bill Number' },
    ];

    const historyColumns: ColumnDef<ExchangeHistoryData>[] = [
        { accessorKey: 'liftNumber', header: 'Lift Number' },
        { accessorKey: 'indentNo', header: 'Indent No.' },
        { accessorKey: 'poNumber', header: 'PO Number' },
        { accessorKey: 'vendorName', header: 'Vendor Name' },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        { accessorKey: 'productName', header: 'Product Name' },
        { accessorKey: 'billStatus', header: 'Bill Status' },
        { accessorKey: 'billNo', header: 'Bill No.' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'leadTimeToLiftMaterial', header: 'Lead Time' },
        { accessorKey: 'typeOfBill', header: 'Type Of Bill' },
        { accessorKey: 'billAmount', header: 'Bill Amount' },
        { accessorKey: 'discountAmount', header: 'Discount' },
        { accessorKey: 'paymentType', header: 'Payment Type' },
        { accessorKey: 'advanceAmountIfAny', header: 'Advance Amount' },
        {
            accessorKey: 'photoOfBill',
            header: 'Bill Photo',
            cell: ({ row }: { row: Row<ExchangeHistoryData> }) => {
                const photo = row.original.photoOfBill;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Bill
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { accessorKey: 'transportationInclude', header: 'Transportation' },
        { accessorKey: 'transporterName', header: 'Transporter' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'receivingStatus', header: 'Receiving Status' },
        { accessorKey: 'receivedQuantity', header: 'Received Qty' },
        {
            accessorKey: 'photoOfProduct',
            header: 'Product Photo',
            cell: ({ row }: { row: Row<ExchangeHistoryData> }) => {
                const photo = row.original.photoOfProduct;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Product
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { accessorKey: 'warrenty', header: 'Warranty' },
        { accessorKey: 'endDateWarrenty', header: 'Warranty End' },
        { accessorKey: 'billReceived', header: 'Bill Received' },
        { accessorKey: 'billNumber', header: 'Bill Number' },
        { accessorKey: 'billAmount2', header: 'Bill Amount' },
        {
            accessorKey: 'billImage',
            header: 'Bill Image',
            cell: ({ row }: { row: Row<ExchangeHistoryData> }) => {
                const photo = row.original.billImage;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Image
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { accessorKey: 'damageOrder', header: 'Damage Order' },
        { accessorKey: 'quantityAsPerBill', header: 'Qty (Bill)' },
        { accessorKey: 'priceAsPerPo', header: 'Price (PO)' },
        { accessorKey: 'remark', header: 'Remark' },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }: { row: Row<ExchangeHistoryData> }) => {
                const status = row.original.status;
                const variant = status === 'Yes' ? 'default' : 'secondary';
                return <Pill variant={variant}>{status}</Pill>;
            },
        },
        { accessorKey: 'exchangeQty', header: 'Exchange Qty' },
        { accessorKey: 'reason', header: 'Reason' },
        { accessorKey: 'billNumber2', header: 'Bill Number' },
    ];

    const schema = z.object({
        status: z.enum(['Yes', 'No']),
    });

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            status: undefined,
        },
    });

    useEffect(() => {
        if (!openDialog) {
            form.reset({
                status: undefined,
            });
        }
    }, [openDialog, form]);

    async function onSubmit(values: z.infer<typeof schema>) {
        try {
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

            await postToSheet(
                storeInSheet
                    .filter((s) => s.liftNumber === selectedItem?.liftNumber)
                    .map((prev) => ({
                        rowIndex: prev.rowIndex,
                        actual10: currentDateTime,
                        status: values.status,
                    })),
                'update',
                'STORE IN'
            );
            toast.success(`Updated status for ${selectedItem?.liftNumber}`);
            setOpenDialog(false);
            setTimeout(() => updateAll(), 1000);
        } catch {
            toast.error('Failed to update status');
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    const handleSubmit = () => {
        form.handleSubmit(onSubmit, onError)();
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-7xl">
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <RefreshCw className="text-primary h-8 w-8" />
                                Exchange Materials
                            </h1>
                            <p className="text-gray-500 mt-1">Process exchange materials and manage returns</p>
                        </div>
                    </div>

                    <Tabs defaultValue="pending" className="w-full">
                        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
                            <TabsTrigger value="pending" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Pending ({pendingData.length})
                            </TabsTrigger>
                            <TabsTrigger value="history" className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                History ({historyData.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending" className="mt-6">
                            <Card className="p-6">
                                <DataTable
                                    data={pendingData}
                                    columns={pendingColumns}
                                    searchFields={[
                                        'liftNumber',
                                        'indentNo',
                                        'productName',
                                        'vendorName',
                                    ]}
                                    dataLoading={false}
                                />
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="mt-6">
                            <Card className="p-6">
                                <DataTable
                                    data={historyData}
                                    columns={historyColumns}
                                    searchFields={[
                                        'liftNumber',
                                        'indentNo',
                                        'productName',
                                        'vendorName',
                                        'status',
                                    ]}
                                    dataLoading={false}
                                />
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {selectedItem && (
                    <DialogContent className="sm:max-w-3xl">
                        <Form {...form}>
                            <div className="space-y-6">
                                <DialogHeader className="space-y-3">
                                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                        <Package className="h-6 w-6 text-primary" />
                                        Process Exchange Material
                                    </DialogTitle>
                                    <DialogDescription className="text-base">
                                        Process exchange material from lift number{' '}
                                        <span className="font-semibold text-primary">
                                            {selectedItem.liftNumber}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                                    <h3 className="text-xl font-bold mb-4 text-gray-800">Material Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-600">Indent Number</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {selectedItem.indentNo}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-600">Lift Number</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {selectedItem.liftNumber}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-600">Product Name</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {selectedItem.productName}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-600">Vendor Name</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {selectedItem.vendorName}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-600">Quantity</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {selectedItem.qty}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-600">Bill Amount</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                ₹{selectedItem.billAmount}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-600">Payment Type</p>
                                            <p className="text-base font-semibold text-gray-900">
                                                {selectedItem.paymentType}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base font-semibold">
                                                    Exchange Status
                                                </FormLabel>
                                                <FormControl>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <SelectTrigger className="w-full h-12 text-base">
                                                            <SelectValue placeholder="Select exchange status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Yes" className="text-base">
                                                                Yes - Exchange Approved
                                                            </SelectItem>
                                                            <SelectItem value="No" className="text-base">
                                                                No - Exchange Rejected
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <DialogFooter className="gap-2 sm:gap-0">
                                    <DialogClose asChild>
                                        <Button variant="outline" size="lg" className="min-w-[100px]">
                                            Cancel
                                        </Button>
                                    </DialogClose>

                                    <Button
                                        onClick={handleSubmit}
                                        disabled={form.formState.isSubmitting}
                                        size="lg"
                                        className="min-w-[150px]"
                                    >
                                        {form.formState.isSubmitting ? (
                                            <>
                                                <Loader
                                                    size={20}
                                                    color="white"
                                                    aria-label="Loading Spinner"
                                                    className="mr-2"
                                                />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Update Status
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </Form>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
};

export default Exchange;