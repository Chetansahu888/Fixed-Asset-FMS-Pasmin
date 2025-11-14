import type { ColumnDef, Row } from '@tanstack/react-table';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { useEffect, useState } from 'react';
import { useSheets } from '@/context/SheetsContext';
import DataTable from '../element/DataTable';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { postToSheet } from '@/lib/fetchers';
import { toast } from 'sonner';
import { PuffLoader as Loader } from 'react-spinners';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Users } from 'lucide-react';
import { Tabs, TabsContent } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { formatDate } from '@/lib/utils';
import { Input } from '../ui/input';

interface RateApprovalData {
    indentNo: string;
    indenter: string;
    department: string;
    product: string;
    comparisonSheet: string;
    vendors: [string, string, string, string, string, string][];
    date: string;
    firmNameMatch?: string;
}

interface HistoryData {
    indentNo: string;
    indenter: string;
    department: string;
    product: string;
    vendor: [string, string];
    date: string;
}

export default () => {
    const { indentLoading, indentSheet, updateIndentSheet } = useSheets();
    const { user } = useAuth();

    const [selectedIndent, setSelectedIndent] = useState<RateApprovalData | null>(null);
    const [selectedHistory, setSelectedHistory] = useState<HistoryData | null>(null);
    const [tableData, setTableData] = useState<RateApprovalData[]>([]);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [openDialog, setOpenDialog] = useState(false);

    
useEffect(() => {
    const filteredByFirm = indentSheet.filter(sheet => 
        user.firmNameMatch.toLowerCase() === "all" || sheet.firmName === user.firmNameMatch
    );
    
    setTableData(
        filteredByFirm
            .filter(
                (sheet) =>
                    sheet.planned3 !== '' &&
                    sheet.actual3 === '' &&
                    sheet.vendorType === 'Three Party'
            )
            .map((sheet: any) => ({
                indentNo: sheet.indentNumber,
                firmNameMatch: sheet.firmNameMatch || '',
                indenter: sheet.indenterName,
                department: sheet.department,
                product: sheet.productName,
                comparisonSheet: sheet.comparisonSheet || '',
                date: formatDate(new Date(sheet.timestamp)),
                vendors: [
                    [
                        sheet.vendorName1, 
                        sheet.rate1?.toString() || '0', 
                        sheet.paymentTerm1,
                        sheet.selectRateType1 || 'With Tax',
                        sheet.withTaxOrNot1 || 'Yes',
                        sheet.taxValue1?.toString() || '0'
                    ],
                    [
                        sheet.vendorName2, 
                        sheet.rate2?.toString() || '0', 
                        sheet.paymentTerm2,
                        sheet.selectRateType2 || 'With Tax',
                        sheet.withTaxOrNot2 || 'Yes',
                        sheet.taxValue2?.toString() || '0'
                    ],
                    [
                        sheet.vendorName3, 
                        sheet.rate3?.toString() || '0', 
                        sheet.paymentTerm3,
                        sheet.selectRateType3 || 'With Tax',
                        sheet.withTaxOrNot3 || 'Yes',
                        sheet.taxValue3?.toString() || '0'
                    ],
                ],
            }))
    );
}, [indentSheet, user.firmNameMatch]);


useEffect(() => {
    const filteredByFirm = indentSheet.filter(sheet => 
        user.firmNameMatch.toLowerCase() === "all" || sheet.firmName === user.firmNameMatch
    );
    
    setHistoryData(
        filteredByFirm
            .filter(
                (sheet) =>
                    sheet.planned3 !== '' &&
                    sheet.actual3 !== '' &&
                    sheet.vendorType === 'Three Party'
            )
            .map((sheet: any) => ({
                indentNo: sheet.indentNumber,
                firmNameMatch: sheet.firmNameMatch || '',
                indenter: sheet.indenterName,
                department: sheet.department,
                product: sheet.productName,
                date: new Date(sheet.timestamp).toDateString(),
                vendor: [sheet.approvedVendorName, sheet.approvedRate?.toString() || '0'],
            }))
    );
}, [indentSheet, user.firmNameMatch]);

    const columns: ColumnDef<RateApprovalData>[] = [
        ...(user.threePartyApprovalAction
            ? [
                {
                    header: 'Action',
                    id: 'action',
                    cell: ({ row }: { row: Row<RateApprovalData> }) => {
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
                                        Approve
                                    </Button>
                                </DialogTrigger>
                            </div>
                        );
                    },
                },
            ]
            : []),
        { accessorKey: 'indentNo', header: 'Indent No.' },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        { accessorKey: 'indenter', header: 'Indenter' },
        { accessorKey: 'department', header: 'Department' },
        { accessorKey: 'product', header: 'Product' },
        { accessorKey: 'date', header: 'Date' },
        {
            accessorKey: 'vendors',
            header: 'Vendors',
            cell: ({ row }) => {
                const vendors = row.original.vendors;
                return (
                    <div className="grid place-items-center">
                        <div className="flex flex-col gap-1">
                            {vendors.map((vendor, index) => (
                                <span key={index} className="rounded-full text-xs px-3 py-1 bg-accent text-accent-foreground border border-accent-foreground">
                                    {vendor[0]} - &#8377;{vendor[1]}
                                </span>
                            ))}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'comparisonSheet',
            header: 'Comparison Sheet',
            cell: ({ row }) => {
                const sheet = row.original.comparisonSheet;
                return sheet ? (
                    <a href={sheet} target="_blank" rel="noopener noreferrer">
                        Comparison Sheet
                    </a>
                ) : (
                    <></>
                );
            },
        },
    ];

    const historyColumns: ColumnDef<HistoryData>[] = [
        ...(user.updateVendorAction ? [
            {
                header: 'Action',
                cell: ({ row }: { row: Row<HistoryData> }) => {
                    const indent = row.original;

                    return (
                        <div>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedHistory(indent);
                                    }}
                                >
                                    Update
                                </Button>
                            </DialogTrigger>
                        </div>
                    );
                },
            },
        ] : []),
        { accessorKey: 'indentNo', header: 'Indent No.' },
        { accessorKey: 'firmNameMatch', header: ' Firm Name' },
        { accessorKey: 'indenter', header: 'Indenter' },
        { accessorKey: 'department', header: 'Department' },
        { accessorKey: 'product', header: 'Product' },
        { accessorKey: 'date', header: 'Date' },
        {
            accessorKey: 'vendor',
            header: 'Vendor',
            cell: ({ row }) => {
                const vendor = row.original.vendor;
                return (
                    <div className="grid place-items-center">
                        <div className="flex flex-col gap-1">
                            <span className="rounded-full text-xs px-3 py-1 bg-accent text-accent-foreground border border-accent-foreground">
                                {vendor[0]} - &#8377;{vendor[1]}
                            </span>
                        </div>
                    </div>
                );
            },
        },
    ];

    const schema = z.object({
        vendor: z.coerce.number(),
    });

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            vendor: undefined,
        },
    });

async function onSubmit(values: z.infer<typeof schema>) {
    try {
        const filtered = indentSheet.filter((s) => s.indentNumber === selectedIndent?.indentNo);
        console.log("🔍 Filtered data:", filtered);
        console.log("🔍 First item rowIndex:", filtered[0]?.rowIndex);
        
        const selectedVendor = selectedIndent?.vendors[values.vendor];
        
        const updatedRows = filtered.map((prev: any) => ({
            rowIndex: prev.rowIndex,
            actual3: new Date().toISOString(),
            approvedVendorName: selectedVendor?.[0] || '',
            approvedRate: selectedVendor?.[1] || '0',
            approvedPaymentTerm: selectedVendor?.[2] || '',
            withTaxOrNot4: selectedVendor?.[4] || 'Yes',
            taxValue4: selectedVendor?.[5] || '0',
        }));
        
        console.log("📤 Sending to backend:", updatedRows);
        
        await postToSheet(updatedRows, 'update');
        
        toast.success(`Approved vendor for ${selectedIndent?.indentNo}`);
        setOpenDialog(false);
        form.reset();
        setTimeout(() => updateIndentSheet(), 1000);
    } catch (error) {
        console.error("❌ Full error:", error);
        toast.error('Failed to update vendor');
    }
}

    const historyUpdateSchema = z.object({
        rate: z.coerce.number(),
    })

    const historyUpdateForm = useForm<z.infer<typeof historyUpdateSchema>>({
        resolver: zodResolver(historyUpdateSchema),
        defaultValues: {
            rate: 0,
        },
    })

    useEffect(() => {
        if (selectedHistory) {
            historyUpdateForm.reset({ rate: parseInt(selectedHistory.vendor[1]) || 0 })
        }
    }, [selectedHistory, historyUpdateForm])

    async function onSubmitHistoryUpdate(values: z.infer<typeof historyUpdateSchema>) {
        try {
            console.log("✅ Submitted Values:", values);
            console.log("✅ Selected History:", selectedHistory);

            const filtered = indentSheet.filter(
                (s) => s.indentNumber === selectedHistory?.indentNo
            );
            console.log("✅ Filtered Sheet Rows:", filtered);

            const updatedRows = filtered.map((prev: any) => ({
                rowIndex: prev.rowIndex,
                approvedRate: values.rate,
            }));
            console.log("✅ Updated Rows Before Sending:", updatedRows);

            await postToSheet(updatedRows, 'update');
            console.log("✅ postToSheet completed");

            toast.success(`Updated rate of ${selectedHistory?.indentNo}`);
            setOpenDialog(false);

            historyUpdateForm.reset({ rate: 0 });
            console.log("✅ Form reset");

            setTimeout(() => {
                console.log("🔄 Refreshing indent sheet...");
                updateIndentSheet();
            }, 1000);
        } catch (err) {
            console.error("❌ Error in onSubmitHistoryUpdate:", err);
            toast.error('Failed to update vendor');
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
                        heading="Three Party Rate Approval"
                        subtext="Approve rates for three party vendors"
                        tabs
                    >
                        <Users size={50} className="text-primary" />
                    </Heading>
                    <TabsContent value="pending">
                        <DataTable
                            data={tableData}
                            columns={columns}
                            searchFields={['product', 'department', 'indenter' ,'firmNameMatch']}
                            dataLoading={indentLoading}
                        />
                    </TabsContent>
                    <TabsContent value="history">
                        <DataTable
                            data={historyData}
                            columns={historyColumns}
                            searchFields={['product', 'department', 'indenter','firmNameMatch']}
                            dataLoading={indentLoading}
                        />
                    </TabsContent>
                </Tabs>

                {selectedIndent && (
                    <DialogContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit, onError)}
                                className="space-y-5"
                            >
                                <DialogHeader className="space-y-1">
                                    <DialogTitle>Rate Approval</DialogTitle>
                                    <DialogDescription>
                                        Update vendor for{' '}
                                        <span className="font-medium">
                                            {selectedIndent.indentNo}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-muted py-2 px-5 rounded-md ">
                                    <div className="space-y-1">
                                        <p className="font-medium">Indenter</p>
                                        <p className="text-sm font-light">
                                            {selectedIndent.indenter}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">Department</p>
                                        <p className="text-sm font-light">
                                            {selectedIndent.department}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-medium">Product</p>
                                        <p className="text-sm font-light">
                                            {selectedIndent.product}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <FormField
                                        control={form.control}
                                        name="vendor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Select a vendor</FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} value={field.value?.toString()}>
                                                        {selectedIndent.vendors.map(
                                                            (vendor, index) => {
                                                                return (
                                                                    <FormItem key={index}>
                                                                        <FormLabel className="flex items-center gap-4 border hover:bg-accent p-3 rounded-md cursor-pointer">
                                                                            <FormControl>
                                                                                <RadioGroupItem value={`${index}`} />
                                                                            </FormControl>
                                                                            <div className="font-normal w-full">
                                                                                <div className="flex justify-between items-center w-full">
                                                                                    <div className="flex-1">
                                                                                        <p className="font-medium text-base">
                                                                                            {vendor[0]}
                                                                                        </p>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            Payment Term: {vendor[2]}
                                                                                        </p>
                                                                                        
                                                                                        {vendor[3] === 'Basic Rate' && vendor[4] === 'No' ? (
                                                                                            <p className="text-xs text-orange-600 font-medium mt-1">
                                                                                                Without Tax - GST: {vendor[5]}%
                                                                                            </p>
                                                                                        ) : vendor[3] === 'With Tax' && vendor[4] === 'Yes' ? (
                                                                                            <p className="text-xs text-green-600 font-medium mt-1">
                                                                                                With Tax
                                                                                            </p>
                                                                                        ) : (
                                                                                            <p className="text-xs text-green-600 font-medium mt-1">
                                                                                                With Tax
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <p className="text-base font-semibold">
                                                                                            &#8377;{vendor[1]}
                                                                                        </p>
                                                                                        {vendor[3] === 'Basic Rate' && vendor[4] === 'No' && (
                                                                                            <p className="text-xs text-muted-foreground">
                                                                                                Basic Rate
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </FormLabel>
                                                                    </FormItem>
                                                                );
                                                            }
                                                        )}
                                                    </RadioGroup>
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
                                        Update
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                )}

                {selectedHistory && (
                    <DialogContent>
                        <Form {...historyUpdateForm}>
                            <form onSubmit={historyUpdateForm.handleSubmit(onSubmitHistoryUpdate, onError)} className="space-y-7">
                                <DialogHeader className="space-y-1">
                                    <DialogTitle>Update Rate</DialogTitle>
                                    <DialogDescription>
                                        Update rate for{' '}
                                        <span className="font-medium">
                                            {selectedHistory.indentNo}
                                        </span>
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-3">
                                    <FormField
                                        control={historyUpdateForm.control}
                                        name="rate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rate</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Close</Button>
                                    </DialogClose>

                                    <Button
                                        type="submit"
                                        disabled={historyUpdateForm.formState.isSubmitting}
                                    >
                                        {historyUpdateForm.formState.isSubmitting && (
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
};