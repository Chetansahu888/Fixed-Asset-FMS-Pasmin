
import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { PuffLoader as Loader } from 'react-spinners';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { postToSheet, uploadFile } from '@/lib/fetchers';
import { Truck } from 'lucide-react';
import Heading from '../element/Heading';

interface FullkittingData {
    indentNumber: string;
    vendorName: string;
    productName: string;
    qty: number;
    billNo: string;
    transportingInclude: string;
    transporterName: string;
    amount: number;
    firmNameMatch: string;
}

export default function FullKitting() {
    const { fullkittingSheet, fullkittingLoading, updateFullkittingSheet } = useSheets();
    const [tableData, setTableData] = useState<FullkittingData[]>([]);
    const [selectedItem, setSelectedItem] = useState<FullkittingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { masterSheet } = useSheets();
    const { user } = useAuth();


    // useEffect(() => {
    //     console.log("Fullkitting Sheet:", fullkittingSheet);
    //     setTableData(
    //         fullkittingSheet
    //             .filter((item) => item.planned && item.planned !== '' && (!item.actual || item.actual === ''))
    //             .map((item) => ({
    //                 indentNumber: item.indentNumber || '',
    //                 vendorName: item.vendorName || '',
    //                 productName: item.productName || '',
    //                 qty: item.qty || 0,
    //                 billNo: item.billNo || '',
    //                 transportingInclude: item.transportingInclude || '',
    //                 transporterName: item.transporterName || '',
    //                 amount: item.amount || 0,
    //             }))
    //     );
    // }, [fullkittingSheet]);

    useEffect(() => {
        console.log("Fullkitting Sheet:", fullkittingSheet);
        
        // Pehle firm name se filter karo (case-insensitive)
        const filteredByFirm = fullkittingSheet.filter(item => 
            user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );
        
        setTableData(
            filteredByFirm
                .filter((item) => item.planned && item.planned !== '' && (!item.actual || item.actual === ''))
                .map((item) => ({
                    indentNumber: item.indentNumber || '',
                    vendorName: item.vendorName || '',
                    productName: item.productName || '',
                    qty: item.qty || 0,
                    billNo: item.billNo || '',
                    transportingInclude: item.transportingInclude || '',
                    transporterName: item.transporterName || '',
                    amount: item.amount || 0,
                    firmNameMatch: item.firmNameMatch || '',
                }))
        );
    }, [fullkittingSheet, user.firmNameMatch]);

    // Add after the existing useEffect
useEffect(() => {
    console.log("Master Sheet:", masterSheet);
    console.log("FMS Names:", masterSheet?.fmsNames);
}, [masterSheet]);

    const columns: ColumnDef<FullkittingData>[] = [
        {
            header: 'Action',
            cell: ({ row }: { row: Row<FullkittingData> }) => {
                const item = row.original;
                return (
                    <DialogTrigger asChild>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedItem(item);
                            }}
                        >
                            Update
                        </Button>
                    </DialogTrigger>
                );
            },
        },
        { accessorKey: 'indentNumber', header: 'Indent Number' },
         { accessorKey: 'firmNameMatch', header: 'Firm Name Match' }, 
        { accessorKey: 'vendorName', header: 'Vendor Name' },
        { accessorKey: 'productName', header: 'Product Name' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'billNo', header: 'Bill No.' },
        { accessorKey: 'transportingInclude', header: 'Transporting Include' },
        { accessorKey: 'transporterName', header: 'Transporter Name' },
        { accessorKey: 'amount', header: 'Amount' },
    ];

    const schema = z.object({
        fmsName: z.string().min(1, 'FMS Name is required'),
        status: z.enum(['Yes', 'No'], { required_error: 'Status is required' }),
        vehicleNumber: z.string().min(1, 'Vehicle Number is required'),
        from: z.string().min(1, 'From is required'),
        to: z.string().min(1, 'To is required'),
        materialLoadDetails: z.string().optional(),
        biltyNumber: z.string().min(1, 'Bilty Number is required'),
        rateType: z.enum(['Fixed', 'Per MT'], { required_error: 'Rate Type is required' }),
        amount: z.string().min(1, 'Amount is required'),
        biltyImage: z.instanceof(File).optional(),
    });

    const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
        fmsName: 'Store Fms',  // ✅ Changed from '' to 'Store Fms'
        status: undefined,
        vehicleNumber: '',
        from: '',
        to: '',
        materialLoadDetails: '',
        biltyNumber: '',
        rateType: undefined,
        amount: '',
        biltyImage: undefined,
    },
});

   useEffect(() => {
    if (!openDialog) {
        form.reset({
            fmsName: 'Store Fms',  // ✅ Changed from '' to 'Store Fms'
            status: undefined,
            vehicleNumber: '',
            from: '',
            to: '',
            materialLoadDetails: '',
            biltyNumber: '',
            rateType: undefined,
            amount: '',
            biltyImage: undefined,
        });
    }
}, [openDialog, form]);

    async function onSubmit(values: z.infer<typeof schema>) {
        try {
            setIsSubmitting(true);
            const currentDateTime = new Date().toISOString();

            let biltyImageUrl = '';
if (values.biltyImage) {
    biltyImageUrl = await uploadFile({
        file: values.biltyImage,  // ✅ Pass the file
        folderId: import.meta.env.VITE_COMPARISON_SHEET_FOLDER
    });
}

            await postToSheet(
                fullkittingSheet
                    .filter((s) => s.indentNumber === selectedItem?.indentNumber)
                    .map((prev) => ({
                        rowIndex: prev.rowIndex,
                        actual: currentDateTime,
                        fmsName: values.fmsName,
                        status: values.status,
                        vehicleNumber: values.vehicleNumber,
                        from: values.from,
                        to: values.to,
                        materialLoadDetails: values.materialLoadDetails || '',
                        biltyNumber: values.biltyNumber,
                        rateType: values.rateType,
                        amount1: values.amount,
                        biltyImage: biltyImageUrl,
                    })),
                'update',
                'Fullkitting'
            );

            toast.success(`Updated fullkitting for ${selectedItem?.indentNumber}`);
            setOpenDialog(false);
            setTimeout(() => updateFullkittingSheet(), 1000);
        } catch (error) {
            console.error('Error updating fullkitting:', error);
            toast.error('Failed to update fullkitting');
        } finally {
            setIsSubmitting(false);
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    return (
        <div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <Heading heading="Full Kitting" subtext="Manage full kitting details">
                    <Truck size={50} className="text-primary" />
                </Heading>

                <DataTable
                    data={tableData}
                    columns={columns}
                    searchFields={['indentNumber', 'productName', 'vendorName','firmNameMatch']}
                    dataLoading={fullkittingLoading}
                />

                {selectedItem && (
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Update Full Kitting</DialogTitle>
                            <DialogDescription>
                                Update details for Indent Number: {selectedItem.indentNumber}
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* FMS Name Dropdown */}
                                    {/* FMS Name Dropdown */}
{/* FMS Name Dropdown - Hardcoded with "Store Fms" as default */}
<FormField
    control={form.control}
    name="fmsName"
    render={({ field }) => (
        <FormItem>
            <FormLabel>FMS Name</FormLabel>
            <Select 
                onValueChange={field.onChange} 
                value={field.value}
                defaultValue="Store Fms"
            >
                <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Store Fms" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {/* Hardcoded FMS options */}
                    <SelectItem value="Store Fms">Store Fms</SelectItem>
                </SelectContent>
            </Select>
            <FormMessage />
        </FormItem>
    )}
/>

                                    {/* Status Dropdown */}
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Yes">Yes</SelectItem>
                                                        <SelectItem value="No">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Vehicle Number */}
                                    <FormField
                                        control={form.control}
                                        name="vehicleNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vehicle Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter vehicle number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Bilty Number */}
                                    <FormField
                                        control={form.control}
                                        name="biltyNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bilty Number</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="text"
                                                        placeholder="Enter bilty number"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* From */}
                                    <FormField
                                        control={form.control}
                                        name="from"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>From</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter source location" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* To */}
                                    <FormField
                                        control={form.control}
                                        name="to"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>To</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter destination location" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Rate Type Dropdown */}
                                    <FormField
                                        control={form.control}
                                        name="rateType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rate Type</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Rate Type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Fixed">Fixed</SelectItem>
                                                        <SelectItem value="Per MT">Per MT</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Amount */}
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
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Material Load Details - Full Width */}
                                <FormField
                                    control={form.control}
                                    name="materialLoadDetails"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Material Load Details</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter material load details"
                                                    {...field}
                                                    rows={3}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Bilty Image - Full Width */}
                                <FormField
                                    control={form.control}
                                    name="biltyImage"
                                    render={({ field: { value, onChange, ...fieldProps } }) => (
                                        <FormItem>
                                            <FormLabel>Bilty Image</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...fieldProps}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(event) => {
                                                        const file = event.target.files?.[0];
                                                        onChange(file);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" disabled={isSubmitting}>
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader size={20} className="mr-2" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit'
                                        )}
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