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
import { Truck, Package, Upload, MapPin, Car, Receipt, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

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

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0
    });

    useEffect(() => {
        const filteredByFirm = fullkittingSheet.filter(item => 
            user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );

        const pendingItems = filteredByFirm.filter(item => item.planned && item.planned !== '' && (!item.actual || item.actual === ''));
        const completedItems = filteredByFirm.filter(item => item.actual && item.actual !== '');

        setTableData(
            pendingItems.map((item) => ({
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

        setStats({
            total: filteredByFirm.length,
            pending: pendingItems.length,
            completed: completedItems.length
        });
    }, [fullkittingSheet, user.firmNameMatch]);

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
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                            setSelectedItem(item);
                            setOpenDialog(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                    >
                        <Truck className="mr-2 h-3 w-3" />
                        Update
                    </Button>
                );
            },
        },
        { 
            accessorKey: 'indentNumber', 
            header: 'Indent No.',
            cell: ({ row }) => (
                <span className="font-medium text-blue-700">{row.original.indentNumber}</span>
            )
        },
        { 
            accessorKey: 'firmNameMatch', 
            header: 'Firm',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50">
                    {row.original.firmNameMatch}
                </Badge>
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
                <span className="font-semibold text-gray-800">{row.original.qty}</span>
            )
        },
        { 
            accessorKey: 'billNo', 
            header: 'Bill No.',
            cell: ({ row }) => (
                <span className="font-medium text-gray-700">{row.original.billNo}</span>
            )
        },
        { 
            accessorKey: 'transportingInclude', 
            header: 'Transport',
            cell: ({ row }) => {
                const hasTransport = row.original.transportingInclude === 'Yes';
                return (
                    <Badge variant={hasTransport ? "default" : "outline"} className={hasTransport ? "bg-green-100 text-green-800" : ""}>
                        {row.original.transportingInclude || 'No'}
                    </Badge>
                );
            }
        },
        { 
            accessorKey: 'transporterName', 
            header: 'Transporter'
        },
        { 
            accessorKey: 'amount', 
            header: 'Amount',
            cell: ({ row }) => (
                <span className="font-semibold text-green-600">₹{row.original.amount?.toFixed(2)}</span>
            )
        },
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
            fmsName: 'Store Fms',
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
                fmsName: 'Store Fms',
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
                    file: values.biltyImage,
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-600 rounded-lg shadow">
                            <Truck size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Full Kitting</h1>
                            <p className="text-gray-600">Manage and update full kitting details for materials</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Items</p>
                                        <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
                                    </div>
                                    <Package className="h-10 w-10 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Pending</p>
                                        <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                                    </div>
                                    <div className="h-10 w-10 flex items-center justify-center bg-amber-100 rounded-full">
                                        <span className="text-amber-600 font-bold">{stats.pending}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Completed</p>
                                        <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
                                    </div>
                                    <div className="h-10 w-10 flex items-center justify-center bg-green-100 rounded-full">
                                        <span className="text-green-600 font-bold">✓</span>
                                    </div>
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
                                <CardTitle className="text-xl font-bold text-gray-800">Pending Full Kitting Items</CardTitle>
                                <p className="text-gray-600 text-sm mt-1">Update full kitting details for pending items</p>
                            </div>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {stats.pending} Pending
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={tableData}
                            columns={columns}
                            searchFields={['indentNumber', 'productName', 'vendorName', 'firmNameMatch', 'billNo']}
                            dataLoading={fullkittingLoading}
                            className="border rounded-lg"
                        />
                    </CardContent>
                </Card>

                {/* Update Dialog */}
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    {selectedItem && (
                        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                                    <DialogHeader>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Truck className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <DialogTitle className="text-xl">Update Full Kitting</DialogTitle>
                                                <DialogDescription>
                                                    Update kitting details for Indent: <span className="font-semibold text-blue-600">{selectedItem.indentNumber}</span>
                                                </DialogDescription>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    <Separator />

                                    {/* Item Details Card */}
                                    <Card className="bg-blue-50 border-blue-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-semibold text-blue-800 flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                Item Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Indent Number</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.indentNumber}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Product</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.productName}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Quantity</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.qty} units</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Vendor</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.vendorName}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Form Fields */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="fmsName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium flex items-center gap-2">
                                                            <Truck className="h-4 w-4" />
                                                            FMS Name
                                                        </FormLabel>
                                                        <Select 
                                                            onValueChange={field.onChange} 
                                                            value={field.value}
                                                            defaultValue="Store Fms"
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                                                    <SelectValue placeholder="Store Fms" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Store Fms">Store Fms</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">Status</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                                                    <SelectValue placeholder="Select Status" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Yes" className="flex items-center gap-2">
                                                                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                                                    Yes
                                                                </SelectItem>
                                                                <SelectItem value="No" className="flex items-center gap-2">
                                                                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                                                                    No
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="vehicleNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium flex items-center gap-2">
                                                            <Car className="h-4 w-4" />
                                                            Vehicle Number
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input 
                                                                placeholder="Enter vehicle number" 
                                                                className="border-gray-300 focus:border-blue-500"
                                                                {...field} 
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="biltyNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium flex items-center gap-2">
                                                            <Receipt className="h-4 w-4" />
                                                            Bilty Number
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="text"
                                                                placeholder="Enter bilty number"
                                                                className="border-gray-300 focus:border-blue-500"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="from"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium flex items-center gap-2">
                                                            <MapPin className="h-4 w-4" />
                                                            From Location
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input 
                                                                placeholder="Enter source location" 
                                                                className="border-gray-300 focus:border-blue-500"
                                                                {...field} 
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="to"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium flex items-center gap-2">
                                                            <MapPin className="h-4 w-4" />
                                                            To Location
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input 
                                                                placeholder="Enter destination location" 
                                                                className="border-gray-300 focus:border-blue-500"
                                                                {...field} 
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="rateType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">Rate Type</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                                                    <SelectValue placeholder="Select Rate Type" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Fixed">Fixed Rate</SelectItem>
                                                                <SelectItem value="Per MT">Per MT</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="amount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium flex items-center gap-2">
                                                            <DollarSign className="h-4 w-4" />
                                                            Amount
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="Enter amount"
                                                                className="border-gray-300 focus:border-blue-500"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="materialLoadDetails"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">Material Load Details</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Enter material load details, weight, quantity, special instructions, etc."
                                                            className="min-h-[100px] border-gray-300 focus:border-blue-500"
                                                            {...field}
                                                            rows={4}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="biltyImage"
                                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium flex items-center gap-2">
                                                        <Upload className="h-4 w-4" />
                                                        Bilty Image
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                                                            <Input
                                                                {...fieldProps}
                                                                type="file"
                                                                accept="image/*"
                                                                className="cursor-pointer border-0"
                                                                onChange={(event) => {
                                                                    const file = event.target.files?.[0];
                                                                    onChange(file);
                                                                }}
                                                            />
                                                            <p className="text-xs text-gray-500 mt-2">
                                                                Upload bilty/receipt image (JPG, PNG, PDF)
                                                            </p>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Separator />

                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                className="border-gray-300"
                                                disabled={isSubmitting}
                                            >
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button 
                                            type="submit" 
                                            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader size={18} className="mr-2" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Truck className="mr-2 h-4 w-4" />
                                                    Update Kitting
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
}