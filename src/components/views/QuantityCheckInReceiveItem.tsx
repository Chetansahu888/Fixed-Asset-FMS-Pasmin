import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { postToSheet, uploadFile } from '@/lib/fetchers';

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
import { Truck } from 'lucide-react';
import { Tabs, TabsContent } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { Pill } from '../ui/pill';

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
    damageOrder?: string;
    quantityAsPerBill?: number;
    priceAsPerPo?: number;
    remark?: string;
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
    billCopyAttached: string;
    debitNote: string;
    reason: string;
    firmNameMatch: string;
    damageOrder?: string;
    quantityAsPerBill?: number;
    priceAsPerPo?: number;
    remark?: string;
}

interface StoreInSheetItem {
    liftNumber?: string;
    indentNo?: string;
    billNo?: string;
    vendorName?: string;
    productName?: string;
    qty?: number;
    typeOfBill?: string;
    billAmount?: number;
    paymentType?: string;
    advanceAmountIfAny?: number | string;
    photoOfBill?: string;
    transportationInclude?: string;
    transporterName?: string;
    amount?: number;
    planned7?: string;
    actual7?: string;
    status?: string;
    billCopyAttached?: string;
    debitNote?: string;
    reason?: string;
    damageOrder?: string;
    quantityAsPerBill?: number;
    priceAsPerPo?: number;
    remark?: string;
    firmNameMatch?: string;
    rowIndex?: number;
}

const schema = z.object({
    status: z.enum(['Accept', 'Reject']),
    billCopyAttached: z.instanceof(File).optional(),
    debitNote: z.enum(['Yes', 'No']),
    reason: z.string().min(1, 'Reason is required'),
});

type FormValues = z.infer<typeof schema>;

export default () => {
    const { storeInSheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [pendingData, setPendingData] = useState<StoreInPendingData[]>([]);
    const [historyData, setHistoryData] = useState<StoreInHistoryData[]>([]);
    const [selectedItem, setSelectedItem] = useState<StoreInPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            status: undefined,
            billCopyAttached: undefined,
            debitNote: undefined,
            reason: '',
        },
    });

    useEffect(() => {
        const filteredByFirm = storeInSheet.filter((item: StoreInSheetItem) => 
            user.firmNameMatch?.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );
        
        setPendingData(
            filteredByFirm
                .filter((i: StoreInSheetItem) => i.planned7 !== '' && i.actual7 === '')
                .map((i: StoreInSheetItem) => ({
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
                    damageOrder: i.damageOrder || '',
                    quantityAsPerBill: i.quantityAsPerBill || 0,
                    priceAsPerPo: i.priceAsPerPo || 0,
                    remark: i.remark || '',
                    firmNameMatch: i.firmNameMatch || '',
                }))
        );
    }, [storeInSheet, user.firmNameMatch]);

    useEffect(() => {
        const filteredByFirm = storeInSheet.filter((item: StoreInSheetItem) => 
            user.firmNameMatch?.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );
        
        setHistoryData(
            filteredByFirm
                .filter((i: StoreInSheetItem) => i.planned7 !== '' && i.actual7 !== '')
                .map((i: StoreInSheetItem) => ({
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
                    billCopyAttached: i.billCopyAttached || '',
                    debitNote: i.debitNote || '',
                    reason: i.reason || '',
                    damageOrder: i.damageOrder || '',
                    quantityAsPerBill: i.quantityAsPerBill || 0,
                    priceAsPerPo: i.priceAsPerPo || 0,
                    remark: i.remark || '',
                    firmNameMatch: i.firmNameMatch || '',
                }))
        );
    }, [storeInSheet, user.firmNameMatch]);

    const pendingColumns: ColumnDef<StoreInPendingData>[] = [
        ...(user.receiveItemView
            ? [
                  {
                      header: 'Action',
                      cell: ({ row }: { row: Row<StoreInPendingData> }) => {
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
        { accessorKey: 'liftNumber', header: 'Lift Number' },
        { accessorKey: 'indentNumber', header: 'Indent No.' },
        { accessorKey: 'billNo', header: 'Bill No.' },
        { accessorKey: 'vendorName', header: 'Vendor Name' },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        { accessorKey: 'productName', header: 'Product Name' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'typeOfBill', header: 'Type Of Bill' },
        { accessorKey: 'billAmount', header: 'Bill Amount' },
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
        { accessorKey: 'damageOrder', header: 'Damage Order' },
        { accessorKey: 'quantityAsPerBill', header: 'Quantity As Per Bill' },
        { accessorKey: 'priceAsPerPo', header: 'Price As Per Po' },
        { accessorKey: 'remark', header: 'Remark' },
    ];

    const historyColumns: ColumnDef<StoreInHistoryData>[] = [
        { accessorKey: 'liftNumber', header: 'Lift Number' },
        { accessorKey: 'indentNumber', header: 'Indent No.' },
        { accessorKey: 'billNo', header: 'Bill No.' },
        { accessorKey: 'vendorName', header: 'Vendor Name' },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        { accessorKey: 'productName', header: 'Product Name' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'typeOfBill', header: 'Type Of Bill' },
        { accessorKey: 'billAmount', header: 'Bill Amount' },
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
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const variant = status === 'Accept' ? 'default' : 'reject';
                return <Pill variant={variant as any}>{status}</Pill>;
            },
        },
        {
            accessorKey: 'billCopyAttached',
            header: 'Bill Copy Attached',
            cell: ({ row }) => {
                const billCopy = row.original.billCopyAttached;
                return billCopy ? (
                    <a href={billCopy} target="_blank" rel="noopener noreferrer">
                        View
                    </a>
                ) : (
                    <></>
                );
            },
        },
        { accessorKey: 'debitNote', header: 'Debit Note' },
        { accessorKey: 'reason', header: 'Reason' },
        { accessorKey: 'damageOrder', header: 'Damage Order' },
        { accessorKey: 'quantityAsPerBill', header: 'Quantity As Per Bill' },
        { accessorKey: 'priceAsPerPo', header: 'Price As Per Po' },
        { accessorKey: 'remark', header: 'Remark' },
    ];

    useEffect(() => {
        if (!openDialog) {
            form.reset({
                status: undefined,
                billCopyAttached: undefined,
                debitNote: undefined,
                reason: '',
            });
        }
    }, [openDialog, form]);

    async function onSubmit(values: FormValues) {
        try {
            console.log('📝 Form values:', values);
            
            let billCopyAttachedUrl = '';

            if (values.billCopyAttached) {
                try {
                    console.log('📤 Uploading bill copy...');
                    billCopyAttachedUrl = await uploadFile({
                        file: values.billCopyAttached,
                        folderId: import.meta.env.VITE_BILL_COPY_FOLDER || import.meta.env.VITE_PRODUCT_PHOTO_FOLDER
                    });
                    console.log('✅ Bill copy uploaded:', billCopyAttachedUrl);
                } catch (uploadError) {
                    console.error('❌ Upload error:', uploadError);
                    toast.error('Failed to upload bill copy');
                    return;
                }
            }

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

            const filteredData = storeInSheet.filter(
                (s: StoreInSheetItem) => s.liftNumber === selectedItem?.liftNumber
            );

            if (filteredData.length === 0) {
                console.error('❌ No matching record found');
                toast.error('No matching record found');
                return;
            }

            const updateData = filteredData.map((prev: StoreInSheetItem) => ({
                rowIndex: prev.rowIndex || 0,
                actual7: currentDateTime,
                status: values.status,
                billCopyAttached: billCopyAttachedUrl,
                sendDebitNote: values.debitNote,
                reason: values.reason,
            }));

            console.log('📤 Update data:', updateData);

            await postToSheet(updateData, 'update', 'STORE IN');

            console.log('✅ Update successful');
            toast.success(`Updated status for ${selectedItem?.liftNumber}`);
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
        <div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Tabs defaultValue="pending">
                    <Heading
                        heading="Reject For GRN"
                        subtext="Process store items and manage returns"
                        tabs
                    >
                        <Truck size={50} className="text-primary" />
                    </Heading>

                    <TabsContent value="pending">
                        <DataTable
                            data={pendingData}
                            columns={pendingColumns}
                            searchFields={[
                                'liftNumber',
                                'indentNumber',
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
                                'indentNumber',
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
                                    <DialogTitle>Process Store Item</DialogTitle>
                                    <DialogDescription>
                                        Process item from lift number{' '}
                                        <span className="font-medium">
                                            {selectedItem.liftNumber}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="bg-muted p-4 rounded-md grid gap-3">
                                    <h3 className="text-lg font-bold">Item Details</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Indent Number</p>
                                            <p className="text-sm font-light">
                                                {selectedItem.indentNumber}
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
                                            <p className="text-sm font-light">
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
                                                            <SelectItem value="Accept">Accept</SelectItem>
                                                            <SelectItem value="Reject">Reject</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {form.watch('status') === 'Accept' && (
                                        <FormField
                                            control={form.control}
                                            name="billCopyAttached"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bill Copy Attached</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="file"
                                                            accept="image/*,.pdf"
                                                            onChange={(e) => field.onChange(e.target.files?.[0])}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {(form.watch('status') === 'Accept' || form.watch('status') === 'Reject') && (
                                        <FormField
                                            control={form.control}
                                            name="reason"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Reason</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter reason" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {(form.watch('status') === 'Accept' || form.watch('status') === 'Reject') && (
                                        <FormField
                                            control={form.control}
                                            name="debitNote"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Send Debit Note</FormLabel>
                                                    <FormControl>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select option" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Yes">Yes</SelectItem>
                                                                <SelectItem value="No">No</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
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