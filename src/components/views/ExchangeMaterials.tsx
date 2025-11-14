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
import { Input } from '../ui/input';
import { postToSheet } from '@/lib/fetchers';
import { RefreshCw } from 'lucide-react';
import { Tabs, TabsContent } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { Pill } from '../ui/pill';

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
    exchangeQty: string |  number;
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


const ExchangeMaterials = () => {
    const { storeInSheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [pendingData, setPendingData] = useState<ExchangePendingData[]>([]);
    const [historyData, setHistoryData] = useState<ExchangeHistoryData[]>([]);
    const [selectedItem, setSelectedItem] = useState<ExchangePendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

// useEffect(() => {
//     setPendingData(
//         storeInSheet
//             .filter((i) => 
//                 i.planned10 && i.planned10 !== '' && 
//                 (!i.actual10 || i.actual10 === '')
//             )
//             .map((i) => ({
//                 timestamp: i.timestamp || '',
//                 liftNumber: i.liftNumber || '',
//                 indentNo: i.indentNo || '',
//                 poNumber: i.poNumber || '',
//                 vendorName: i.vendorName || '',
//                 productName: i.productName || '',
//                 billStatus: i.billStatus || '',
//                 billNo: i.billNo || '',
//                 qty: i.qty || 0,
//                 leadTimeToLiftMaterial: (i.leadTimeToLiftMaterial || '') as string | number,
//                 typeOfBill: i.typeOfBill || '',
//                 billAmount: i.billAmount || 0,
//                 discountAmount: i.discountAmount || 0,
//                 paymentType: i.paymentType || '',
//                 advanceAmountIfAny: i.advanceAmountIfAny || 0,
//                 photoOfBill: i.photoOfBill || '',
//                 transportationInclude: i.transportationInclude || '',
//                 transporterName: i.transporterName || '',
//                 amount: i.amount || 0,
//                 receivingStatus: i.receivingStatus || '',
//                 receivedQuantity: i.receivedQuantity || 0,
//                 photoOfProduct: i.photoOfProduct || '',
//                 warrenty: i.warrenty || '',
//                 endDateWarrenty: i.endDateWarrenty || '',
//                 billReceived: i.billReceived || '',
//                 billNumber: i.billNumber || '',
//                 billAmount2: i.billAmount2 || '',
//                 billImage: i.billImage || '',
//                 damageOrder: i.damageOrder || '',
//                 quantityAsPerBill: i.quantityAsPerBill || 0,
//                 priceAsPerPo: i.priceAsPerPo || 0,
//                 remark: i.remark || '',
//                 status: i.status || '',
//                 exchangeQty: (i.exchangeQty || 0) as string | number,
//                 reason: i.reason || '',
//                 billNumber2: i.billNumber2 || '',
//                 planned10: i.planned10 || '',
//                 actual10: i.actual10 || '',
//             } as ExchangePendingData))
//     );
// }, [storeInSheet]);

// useEffect(() => {
//     setHistoryData(
//         storeInSheet
//             .filter((i) => 
//                 i.actual10 && i.actual10 !== ''
//             )
//             .map((i) => ({
//                 timestamp: i.timestamp || '',
//                 liftNumber: i.liftNumber || '',
//                 indentNo: i.indentNo || '',
//                 poNumber: i.poNumber || '',
//                 vendorName: i.vendorName || '',
//                 productName: i.productName || '',
//                 billStatus: i.billStatus || '',
//                 billNo: i.billNo || '',
//                 qty: i.qty || 0,
//                 leadTimeToLiftMaterial: (i.leadTimeToLiftMaterial || '') as string | number,
//                 typeOfBill: i.typeOfBill || '',
//                 billAmount: i.billAmount || 0,
//                 discountAmount: i.discountAmount || 0,
//                 paymentType: i.paymentType || '',
//                 advanceAmountIfAny: i.advanceAmountIfAny || 0,
//                 photoOfBill: i.photoOfBill || '',
//                 transportationInclude: i.transportationInclude || '',
//                 transporterName: i.transporterName || '',
//                 amount: i.amount || 0,
//                 receivingStatus: i.receivingStatus || '',
//                 receivedQuantity: i.receivedQuantity || 0,
//                 photoOfProduct: i.photoOfProduct || '',
//                 warrenty: i.warrenty || '',
//                 endDateWarrenty: i.endDateWarrenty || '',
//                 billReceived: i.billReceived || '',
//                 billNumber: i.billNumber || '',
//                 billAmount2: i.billAmount2 || '',
//                 billImage: i.billImage || '',
//                 damageOrder: i.damageOrder || '',
//                 quantityAsPerBill: i.quantityAsPerBill || 0,
//                 priceAsPerPo: i.priceAsPerPo || 0,
//                 remark: i.remark || '',
//                 status: i.status || '',
//                 exchangeQty: (i.exchangeQty || 0) as string | number,
//                 reason: i.reason || '',
//                 billNumber2: i.billNumber2 || '',
//                 planned10: i.planned10 || '',
//                 actual10: i.actual10 || '',
//             } as ExchangeHistoryData))
//     );
// }, [storeInSheet]);

useEffect(() => {
    // Pehle firm name se filter karo (case-insensitive)
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
            } as ExchangePendingData))
    );
}, [storeInSheet, user.firmNameMatch]);

useEffect(() => {
    // Pehle firm name se filter karo (case-insensitive)
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

useEffect(() => {
    console.log('StoreInSheet data:', storeInSheet);
    console.log('Exchange items:', storeInSheet.filter(i => i.typeOfBill === 'Exchange'));
}, [storeInSheet]);

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
                                      variant="outline"
                                      onClick={() => {
                                          setSelectedItem(item);
                                      }}
                                  >
                                      Process
                                  </Button>
                              </DialogTrigger>
                          );
                      },
                  },
              ]
            : []),
        // { accessorKey: 'timestamp', header: 'Timestamp' },
        { accessorKey: 'liftNumber', header: 'Lift Number' },
        { accessorKey: 'indentNo', header: 'Indent No.' },
        { accessorKey: 'poNumber', header: 'PO Number' },
        { accessorKey: 'vendorName', header: 'Vendor Name' },
         { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        { accessorKey: 'productName', header: 'Product Name' },
        { accessorKey: 'billStatus', header: 'Bill Status' },
        { accessorKey: 'billNo', header: 'Bill No.' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'leadTimeToLiftMaterial', header: 'Lead Time To Lift Material' },
        { accessorKey: 'typeOfBill', header: 'Type Of Bill' },
        { accessorKey: 'billAmount', header: 'Bill Amount' },
        { accessorKey: 'discountAmount', header: 'Discount Amount' },
        { accessorKey: 'paymentType', header: 'Payment Type' },
        { accessorKey: 'advanceAmountIfAny', header: 'Advance Amount If Any' },
        {
            accessorKey: 'photoOfBill',
            header: 'Photo Of Bill',
            cell: ({ row }) => {
                const photo = row.original.photoOfBill;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer">
                        Bill
                    </a>
                ) : (
                    <></>
                );
            },
        },
        { accessorKey: 'transportationInclude', header: 'Transportation Include' },
        { accessorKey: 'transporterName', header: 'Transporter Name' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'receivingStatus', header: 'Receiving Status' },
        { accessorKey: 'receivedQuantity', header: 'Received Quantity' },
        {
            accessorKey: 'photoOfProduct',
            header: 'Photo Of Product',
            cell: ({ row }) => {
                const photo = row.original.photoOfProduct;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer">
                        Product
                    </a>
                ) : (
                    <></>
                );
            },
        },
        { accessorKey: 'warrenty', header: 'Warrenty' },
        { accessorKey: 'endDateWarrenty', header: 'End Date Warrenty' },
        { accessorKey: 'billReceived', header: 'Bill Received' },
        { accessorKey: 'billNumber', header: 'Bill Number' },
        { accessorKey: 'billAmount2', header: 'Bill Amount' },
        {
            accessorKey: 'billImage',
            header: 'Bill Image',
            cell: ({ row }) => {
                const photo = row.original.billImage;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer">
                        Bill Image
                    </a>
                ) : (
                    <></>
                );
            },
        },
        { accessorKey: 'damageOrder', header: 'Damage Order' },
        { accessorKey: 'quantityAsPerBill', header: 'Quantity As Per Bill' },
        { accessorKey: 'priceAsPerPo', header: 'Price As Per Po' },
        { accessorKey: 'remark', header: 'Remark' },
        { accessorKey: 'status', header: 'Status' },
        { accessorKey: 'exchangeQty', header: 'Exchange Qty' },
        { accessorKey: 'reason', header: 'Reason' },
        { accessorKey: 'billNumber2', header: 'Bill Number' },
    ];

    const historyColumns: ColumnDef<ExchangeHistoryData>[] = [
        // { accessorKey: 'timestamp', header: 'Timestamp' },
        { accessorKey: 'liftNumber', header: 'Lift Number' },
        { accessorKey: 'indentNo', header: 'Indent No.' },
        { accessorKey: 'poNumber', header: 'PO Number' },
        { accessorKey: 'vendorName', header: 'Vendor Name' },
         { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        { accessorKey: 'productName', header: 'Product Name' },
        { accessorKey: 'billStatus', header: 'Bill Status' },
        { accessorKey: 'billNo', header: 'Bill No.' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'leadTimeToLiftMaterial', header: 'Lead Time To Lift Material' },
        { accessorKey: 'typeOfBill', header: 'Type Of Bill' },
        { accessorKey: 'billAmount', header: 'Bill Amount' },
        { accessorKey: 'discountAmount', header: 'Discount Amount' },
        { accessorKey: 'paymentType', header: 'Payment Type' },
        { accessorKey: 'advanceAmountIfAny', header: 'Advance Amount If Any' },
        {
            accessorKey: 'photoOfBill',
            header: 'Photo Of Bill',
            cell: ({ row }) => {
                const photo = row.original.photoOfBill;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer">
                        Bill
                    </a>
                ) : (
                    <></>
                );
            },
        },
        { accessorKey: 'transportationInclude', header: 'Transportation Include' },
        { accessorKey: 'transporterName', header: 'Transporter Name' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'receivingStatus', header: 'Receiving Status' },
        { accessorKey: 'receivedQuantity', header: 'Received Quantity' },
        {
            accessorKey: 'photoOfProduct',
            header: 'Photo Of Product',
            cell: ({ row }) => {
                const photo = row.original.photoOfProduct;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer">
                        Product
                    </a>
                ) : (
                    <></>
                );
            },
        },
        { accessorKey: 'warrenty', header: 'Warrenty' },
        { accessorKey: 'endDateWarrenty', header: 'End Date Warrenty' },
        { accessorKey: 'billReceived', header: 'Bill Received' },
        { accessorKey: 'billNumber', header: 'Bill Number' },
        { accessorKey: 'billAmount2', header: 'Bill Amount' },
        {
            accessorKey: 'billImage',
            header: 'Bill Image',
            cell: ({ row }) => {
                const photo = row.original.billImage;
                return photo ? (
                    <a href={photo} target="_blank" rel="noopener noreferrer">
                        Bill Image
                    </a>
                ) : (
                    <></>
                );
            },
        },
        { accessorKey: 'damageOrder', header: 'Damage Order' },
        { accessorKey: 'quantityAsPerBill', header: 'Quantity As Per Bill' },
        { accessorKey: 'priceAsPerPo', header: 'Price As Per Po' },
        { accessorKey: 'remark', header: 'Remark' },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const variant = status === 'Return' ? 'secondary' : 'reject';
                return <Pill variant={variant}>{status}</Pill>;
            },
        },
        { accessorKey: 'exchangeQty', header: 'Exchange Qty' },
        { accessorKey: 'reason', header: 'Reason' },
        { accessorKey: 'billNumber2', header: 'Bill Number' },
    ];

    const schema = z.object({
    status: z.enum(['Yes', 'No']), // Changed from ['Return', 'Not Return', 'Exchange'] to ['Yes', 'No']
});

    const form = useForm({
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
                    rowIndex: prev.rowIndex,  // To identify the row
                    actual10: currentDateTime, // Timestamp
                    status: values.status,     // Status (Yes/No)
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

    return (
        <div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Tabs defaultValue="pending">
                    <Heading
                        heading="Exchange Materials"
                        subtext="Process exchange materials and manage returns"
                        tabs
                    >
                        <RefreshCw size={50} className="text-primary" />
                    </Heading>

                    <TabsContent value="pending">
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
                    </TabsContent>
                    <TabsContent value="history">
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
                    </TabsContent>
                </Tabs>

                {selectedItem && (
    <DialogContent className="sm:max-w-2xl">
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-5"
            >
                <DialogHeader className="space-y-1">
                    <DialogTitle>Process Exchange Material</DialogTitle>
                    <DialogDescription>
                        Process exchange material from lift number{' '}
                        <span className="font-medium">
                            {selectedItem.liftNumber}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted p-4 rounded-md grid gap-3">
                    <h3 className="text-lg font-bold">Material Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <p className="font-medium text-nowrap">Indent Number</p>
                            <p className="text-sm font-light">
                                {selectedItem.indentNo}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-nowrap">Lift Number</p>
                            <p className="text-sm font-light">
                                {selectedItem.liftNumber}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">Product Name</p>
                            <p className="text-sm font-light">
                                {selectedItem.productName}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">Vendor Name</p>
                            <p className="textsm font-light">
                                {selectedItem.vendorName}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">Quantity</p>
                            <p className="text-sm font-light">{selectedItem.qty}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">Bill Amount</p>
                            <p className="text-sm font-light">
                                {selectedItem.billAmount}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium">Payment Type</p>
                            <p className="text-sm font-light">
                                {selectedItem.paymentType}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <FormControl>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Yes">
                                                Yes
                                            </SelectItem>
                                            <SelectItem value="No">
                                                No
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                            </FormItem>
                        )}
                    />
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
                        Update Status
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    </DialogContent>
)}
            </Dialog>
        </div>
    );
};

export default ExchangeMaterials;