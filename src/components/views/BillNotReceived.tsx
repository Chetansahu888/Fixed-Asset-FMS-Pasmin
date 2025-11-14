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
import { Textarea } from '../ui/textarea';
import { postToSheet, uploadFile } from '@/lib/fetchers';
import type { ReceivedSheet } from '@/types';
import { Truck } from 'lucide-react';
import { Tabs, TabsContent } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { formatDate } from '@/lib/utils';
import { Pill } from '../ui/pill';

interface StoreInPendingData {
    liftNumber: string;
    indentNo: string;
    billNo: string;
    vendorName: string;
    productName: string;
    qty: number;
    typeOfBill: string;
    billAmount: number;
    paymentType: string;
    advanceAmountIfAny: string;
    photoOfBill: string;
    transportationInclude: string;
    transporterName: string;
    amount: number;
    // Add missing properties that are used in columns
    poDate: string;
    poNumber: string;
    vendor: string;
    indentNumber: string;
    product: string;
    uom: string;
    quantity: number;
    poCopy: string;

    billStatus: string;
    leadTimeToLiftMaterial: number;
    discountAmount: number;
    rowIndex?: number; // Added to fix the error
    firmNameMatch: string;
}


// Fix type names to match usage
type RecieveItemsData = StoreInPendingData;

export default () => {
    const { storeInSheet, indentSheet, updateAll } = useSheets();
    const { user } = useAuth();


    const [tableData, setTableData] = useState<StoreInPendingData[]>([]);
    const [selectedIndent, setSelectedIndent] = useState<StoreInPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);

    // Add loading states
    const [indentLoading, setIndentLoading] = useState(false);
    const [receivedLoading, setReceivedLoading] = useState(false);

    // useEffect(() => {
    //     setTableData(
    //         storeInSheet
    //             .filter((i) => i.planned11 !== '' && i.actual11 === '')
    //             .map((i) => ({
    //                 liftNumber: i.liftNumber || '',
    //                 indentNo: i.indentNo || '',
    //                 billNo: String(i.billNo) || '',
    //                 vendorName: i.vendorName || '',
    //                 productName: i.productName || '',
    //                 qty: i.qty || 0,
    //                 typeOfBill: i.typeOfBill || '',
    //                 billAmount: i.billAmount || 0,
    //                 paymentType: i.paymentType || '',
    //                 advanceAmountIfAny: i.advanceAmountIfAny || '',
    //                 photoOfBill: i.photoOfBill || '',
    //                 transportationInclude: i.transportationInclude || '',
    //                 transporterName: i.transporterName || '',
    //                 amount: i.amount || 0,
    //                 // Add missing mapped properties
    //                 poDate: i.poDate || '',
    //                 poNumber: i.poNumber || '',
    //                 vendor: i.vendor || '',
    //                 indentNumber: i.indentNumber || '',
    //                 product: i.product || '',
    //                 uom: i.uom || '',
    //                 quantity: i.quantity || 0,
    //                 poCopy: i.poCopy || '',

    //                 billStatus: i.billStatus || '',
    //                 leadTimeToLiftMaterial: i.leadTimeToLiftMaterial || 0,
    //                 discountAmount: i.discountAmount || 0,
    //                 rowIndex: i.rowIndex,
    //             }))
    //     );
    // }, [storeInSheet]);

    useEffect(() => {
    // Pehle firm name se filter karo (case-insensitive)
    const filteredByFirm = storeInSheet.filter(item => 
        user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
    );
    
    setTableData(
        filteredByFirm
            .filter((i) => i.planned11 !== '' && i.actual11 === '')
            .map((i) => ({
                liftNumber: i.liftNumber || '',
                indentNo: i.indentNo || '',
                billNo: String(i.billNo) || '',
                vendorName: i.vendorName || '',
                productName: i.productName || '',
                qty: i.qty || 0,
                typeOfBill: i.typeOfBill || '',
                billAmount: i.billAmount || 0,
                paymentType: i.paymentType || '',
                advanceAmountIfAny: i.advanceAmountIfAny || '',
                photoOfBill: i.photoOfBill || '',
                transportationInclude: i.transportationInclude || '',
                transporterName: i.transporterName || '',
                amount: i.amount || 0,
                // Add missing mapped properties
                poDate: i.poDate || '',
                poNumber: i.poNumber || '',
                vendor: i.vendor || '',
                indentNumber: i.indentNumber || '',
                product: i.product || '',
                uom: i.uom || '',
                quantity: i.quantity || 0,
                poCopy: i.poCopy || '',

                billStatus: i.billStatus || '',
                leadTimeToLiftMaterial: i.leadTimeToLiftMaterial || 0,
                discountAmount: i.discountAmount || 0,
                rowIndex: i.rowIndex,
                 firmNameMatch: i.firmNameMatch || '',
            }))
    );
}, [storeInSheet, user.firmNameMatch]);


    useEffect(() => {
        if (!openDialog) {
            form.reset({ status: undefined });
        }
    }, [openDialog]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const schema = z.object({
    status: z.enum(['ok']),
    billImageStatus: z.instanceof(File).optional().refine((file) => {
        if (!file) return true;
        return file.size <= 5 * 1024 * 1024; // 5MB max
    }, 'File size should be less than 5MB'),
});

    const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
        status: undefined,
        billImageStatus: undefined,
    },
});


    const columns: ColumnDef<RecieveItemsData>[] = [
        ...(user.receiveItemView
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<RecieveItemsData> }) => {
                        const indent = row.original;
                        return (
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedIndent(indent);
                                    }}
                                >
                                    Action
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
        { accessorKey: 'leadTimeToLiftMaterial', header: 'Lead Time To Lift Material' },
        { accessorKey: 'typeOfBill', header: 'Type Of Bill' },
        { accessorKey: 'billAmount', header: 'Bill Amount' },
        { accessorKey: 'discountAmount', header: 'Discount Amount' },
        { accessorKey: 'paymentType', header: 'Payment Type' },
        {
            accessorKey: 'advanceAmountIfAny',
            header: 'Advance Amount If Any',
            cell: ({ row }) => formatDate(row.original.advanceAmountIfAny)
        },

        {
            accessorKey: 'photoOfBill',
            header: 'Photo Of Bill',
            cell: ({ row }) => {
                const photo = row.original.photoOfBill;
                return photo ? (
                    <a href={photo} target="_blank">
                        View
                    </a>
                ) : null;
            },
        },
        { accessorKey: 'transportationInclude', header: 'Transportation Include' },
        { accessorKey: 'transporterName', header: 'Transporter Name' },
        { accessorKey: 'amount', header: 'Amount' },
    ];





    // async function onSubmit(values: z.infer<typeof schema>) {
    //     try {
    //         const mappedData = [
    //             {
    //                 indentNo: selectedIndent!.indentNo,
    //                 actual11: new Date().toISOString(),
    //                 billStatusNew: values.status,
    //                 rowIndex: selectedIndent!.rowIndex, // ✅ Add this line
    //             }
    //         ];

    //         console.log('Mapped data to post:', mappedData);

    //         await postToSheet(mappedData, 'update', 'STORE IN');

    //         toast.success(`Bill status updated for ${selectedIndent?.indentNo}`);
    //         setOpenDialog(false);
    //         setTimeout(() => updateAll(), 1000);
    //     } catch (err) {
    //         console.error("Error:", err);
    //         toast.error('Failed to update');
    //     }
    // }


    async function onSubmit(values: z.infer<typeof schema>) {
    try {
        let billImageUrl = '';
        
        // Upload image if provided
        if (values.billImageStatus) {
            const uploadedUrl = await uploadFile(
                // values.billImageStatus
                import.meta.env.VITE_BILL_PHOTO_FOLDER
            );
            billImageUrl = uploadedUrl;
        }

        const mappedData = [
            {
                indentNo: selectedIndent!.indentNo,
                actual11: new Date().toISOString(),
                billStatusNew: values.status,
                billImageStatus: billImageUrl,
                rowIndex: selectedIndent!.rowIndex,
            }
        ];

        console.log('Mapped data to post:', mappedData);

        await postToSheet(mappedData, 'update', 'STORE IN');

        toast.success(`Bill status updated for ${selectedIndent?.indentNo}`);
        setOpenDialog(false);
        setTimeout(() => updateAll(), 1000);
    } catch (err) {
        console.error("Error:", err);
        toast.error('Failed to update');
    }
}




    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    // console.log("selectedIndent", selectedIndent);

    return (
        <div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Tabs defaultValue="pending">
                    <Heading
                        heading="Bill Status"
                        subtext="Receive items from purchase orders"
                    // tabs
                    >
                        <Truck size={50} className="text-primary" />
                    </Heading>

                    <TabsContent value="pending">
                        <DataTable
                            data={tableData}
                            columns={columns}
                            searchFields={[
                                'liftNumber',
                                'indentNo',
                                'poNumber',
                                'vendorName',
                                'productName',
                                'billStatus',
                                'billNo',
                                'qty',
                                'leadTimeToLiftMaterial',
                                'typeOfBill',
                                'billAmount',
                                'discountAmount',
                                'paymentType',
                                'advanceAmountIfAny',
                                'transportationInclude',
                                'transporterName',
                                'amount'
                            ]}
                            dataLoading={indentLoading}
                        />
                    </TabsContent>

                </Tabs>

                {selectedIndent && (
                    <DialogContent className="sm:max-w-3xl">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit, onError)}
                                className="space-y-5"
                            >
                                <DialogHeader className="space-y-1">
                                    <DialogTitle>Store In</DialogTitle>
                                    <DialogDescription>
                                        Store In from indent{' '}
                                        <span className="font-medium">
                                            {selectedIndent.indentNo}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="bg-muted p-4 rounded-md grid gap-3">
                                    <h3 className="text-lg font-bold">Item Details</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 bg-muted rounded-md gap-3 ">
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">Indent Number</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.indentNo}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium">Item Name</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.productName}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">
                                                Ordered Quantity
                                            </p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.quantity}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium text-nowrap">UOM</p>
                                            <p className="text-sm font-light">
                                                {selectedIndent.uom}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                               <div className="grid md:grid-cols-2 gap-4">
    <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
            <FormItem>
                <FormControl>
                    <Select
                        onValueChange={field.onChange}
                        value={field.value}
                    >
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Set status" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="ok">ok</SelectItem>
                        </SelectContent>
                    </Select>
                </FormControl>
            </FormItem>
        )}
    />

    {form.watch('status') === 'ok' && (
        <FormField
            control={form.control}
            name="billImageStatus"
            render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                    <FormLabel>Bill Image</FormLabel>
                    <FormControl>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) onChange(file);
                            }}
                            {...field}
                        />
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
                                        Store In
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
