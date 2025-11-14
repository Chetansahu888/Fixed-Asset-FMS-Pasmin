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
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { PuffLoader as Loader } from 'react-spinners';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { UserCheck, PenSquare, Calendar, X, Search, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Heading from '../element/Heading';
import { Pill } from '../ui/pill';
import { formatDate } from '@/lib/utils';

interface VendorUpdateData {
    indentNo: string;
    firmNameMatch?: string;
    indenter: string;
    department: string;
    product: string;
    quantity: number;
    uom: string;
    vendorType: 'Three Party' | 'Regular';
    planned2: string;
    actual2: string;
    specifications: string;
}

interface HistoryData {
    indentNo: string;
    indenter: string;
    department: string;
    product: string;
    quantity: number;
    uom: string;
    rate: number;
    vendorType: 'Three Party' | 'Regular';
    date: string;
    lastUpdated?: string;
    planned2: string;
    actual2: string;
    specifications: string;
    firmNameMatch?: string;
}

export default () => {
    const { indentSheet, indentLoading, updateIndentSheet, masterSheet: options } = useSheets();
    const { user } = useAuth();

    const [selectedIndent, setSelectedIndent] = useState<VendorUpdateData | null>(null);
    const [selectedHistory, setSelectedHistory] = useState<HistoryData | null>(null);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [tableData, setTableData] = useState<VendorUpdateData[]>([]);
    const [filteredTableData, setFilteredTableData] = useState<VendorUpdateData[]>([]);
    const [filteredHistoryData, setFilteredHistoryData] = useState<HistoryData[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingRow, setEditingRow] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<HistoryData>>({});
    
    // Filter states
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedUOM, setSelectedUOM] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>('');
    const [selectedHistoryUOM, setSelectedHistoryUOM] = useState<string>('');
    const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

    // Fetching table data
    useEffect(() => {
        const filteredByFirm = indentSheet.filter(sheet =>
            user.firmNameMatch.toLowerCase() === "all" || sheet.firmName === user.firmNameMatch
        );

        const data = filteredByFirm
            .filter((sheet) => sheet.planned2 !== '' && sheet.actual2 === '')
            .map((sheet) => ({
                indentNo: sheet.indentNumber,
                firmNameMatch: sheet.firmNameMatch || '',
                indenter: sheet.indenterName,
                department: sheet.department,
                product: sheet.productName,
                quantity: sheet.approvedQuantity,
                uom: sheet.uom,
                vendorType: sheet.vendorType as VendorUpdateData['vendorType'],
                planned2: sheet.planned2,
                actual2: sheet.actual2,
                specifications: sheet.specifications || '',
            }));
        
        setTableData(data);
        setFilteredTableData(data);
    }, [indentSheet, user.firmNameMatch]);

    useEffect(() => {
        const filteredByFirm = indentSheet.filter(sheet =>
            user.firmNameMatch.toLowerCase() === "all" || sheet.firmName === user.firmNameMatch
        );

        const data = filteredByFirm
            .filter((sheet) => sheet.planned2 !== '' && sheet.actual2 !== '')
            .map((sheet) => ({
                date: formatDate(new Date(sheet.actual2)),
                indentNo: sheet.indentNumber,
                firmNameMatch: sheet.firmNameMatch || '',
                indenter: sheet.indenterName,
                department: sheet.department,
                product: sheet.productName,
                quantity: sheet.quantity,
                uom: sheet.uom,
                rate: sheet.approvedRate || 0,
                vendorType: sheet.vendorType as HistoryData['vendorType'],
                planned2: sheet.planned2,
                actual2: sheet.actual2,
                specifications: sheet.specifications || '',
            }))
            .sort((a, b) => {
                return b.indentNo.localeCompare(a.indentNo);
            });
        
        setHistoryData(data);
        setFilteredHistoryData(data);
    }, [indentSheet, user.firmNameMatch]);

    // Filter pending data by date, UOM, and search query
    useEffect(() => {
        let filtered = [...tableData];

        // Filter by date
        if (selectedDate) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.planned2).toISOString().split('T')[0];
                return itemDate === selectedDate;
            });
        }

        // Filter by UOM
        if (selectedUOM && selectedUOM !== '__all__') {
            filtered = filtered.filter(item => item.uom === selectedUOM);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.indentNo.toLowerCase().includes(query) ||
                item.firmNameMatch?.toLowerCase().includes(query) ||
                item.indenter.toLowerCase().includes(query) ||
                item.department.toLowerCase().includes(query) ||
                item.product.toLowerCase().includes(query) ||
                item.specifications.toLowerCase().includes(query)
            );
        }

        setFilteredTableData(filtered);
    }, [selectedDate, selectedUOM, searchQuery, tableData]);

    // Filter history data by date, UOM, and search query
    useEffect(() => {
        let filtered = [...historyData];

        // Filter by date
        if (selectedHistoryDate) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.actual2).toISOString().split('T')[0];
                return itemDate === selectedHistoryDate;
            });
        }

        // Filter by UOM
        if (selectedHistoryUOM && selectedHistoryUOM !== '__all__') {
            filtered = filtered.filter(item => item.uom === selectedHistoryUOM);
        }

        // Filter by search query
        if (historySearchQuery.trim()) {
            const query = historySearchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.indentNo.toLowerCase().includes(query) ||
                item.firmNameMatch?.toLowerCase().includes(query) ||
                item.indenter.toLowerCase().includes(query) ||
                item.department.toLowerCase().includes(query) ||
                item.product.toLowerCase().includes(query) ||
                item.specifications.toLowerCase().includes(query)
            );
        }

        setFilteredHistoryData(filtered);
    }, [selectedHistoryDate, selectedHistoryUOM, historySearchQuery, historyData]);

    // Get unique UOMs for filter dropdown
    const uniqueUOMs = Array.from(new Set(tableData.map(item => item.uom))).sort();
    const uniqueHistoryUOMs = Array.from(new Set(historyData.map(item => item.uom))).sort();

    const handleEditClick = (row: HistoryData) => {
        setEditingRow(row.indentNo);
        setEditValues({
            quantity: row.quantity,
            uom: row.uom,
            vendorType: row.vendorType,
        });
    };

    const handleCancelEdit = () => {
        setEditingRow(null);
        setEditValues({});
    };

    const handleSaveEdit = async (indentNo: string) => {
        try {
            await postToSheet(
                indentSheet
                    .filter((s) => s.indentNumber === indentNo)
                    .map((prev) => ({
                        rowIndex: prev.rowIndex,
                        quantity: editValues.quantity,
                        uom: editValues.uom,
                        vendorType: editValues.vendorType,
                        lastUpdated: new Date().toISOString(),
                    })),
                'update'
            );
            toast.success(`Updated indent ${indentNo}`);
            updateIndentSheet();
            setEditingRow(null);
            setEditValues({});
        } catch {
            toast.error('Failed to update indent');
        }
    };

    const handleInputChange = (field: keyof HistoryData, value: any) => {
        setEditValues((prev) => ({ ...prev, [field]: value }));
    };

    // Clear all filters function
    const clearAllFilters = () => {
        setSelectedDate('');
        setSelectedUOM('');
        setSearchQuery('');
    };

    const clearAllHistoryFilters = () => {
        setSelectedHistoryDate('');
        setSelectedHistoryUOM('');
        setHistorySearchQuery('');
    };

    // Creating table columns
    const columns: ColumnDef<VendorUpdateData>[] = [
        ...(user.updateVendorAction
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<VendorUpdateData> }) => {
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
        },
        {
            accessorKey: 'firmNameMatch',
            header: 'Firm Name',
        },
        {
            accessorKey: 'indenter',
            header: 'Indenter',
        },
        {
            accessorKey: 'department',
            header: 'Department',
        },
        {
            accessorKey: 'specifications',
            header: 'Specifications',
            cell: ({ getValue }) => (
                <div className="max-w-[200px] break-words whitespace-normal">
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'product',
            header: 'Product',
            cell: ({ getValue }) => (
                <div className="max-w-[150px] break-words whitespace-normal">
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'quantity',
            header: 'Quantity',
        },
        {
            accessorKey: 'uom',
            header: 'UOM',
        },
        {
            accessorKey: 'vendorType',
            header: 'Vendor Type',
            cell: ({ row }) => {
                const status = row.original.vendorType;
                const variant = status === 'Regular' ? 'primary' : 'secondary';
                return <Pill variant={variant}>{status}</Pill>;
            },
        },
        { 
            accessorKey: 'planned2', 
            header: 'Planned Date', 
            cell: ({ row }) => formatDateTime(row.original.planned2) 
        },
    ];

    const historyColumns: ColumnDef<HistoryData>[] = [
        ...(user.updateVendorAction
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<HistoryData> }) => {
                        const indent = row.original;

                        return (
                            <div>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        disabled={indent.vendorType === 'Three Party'}
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
            ]
            : []),
        {
            accessorKey: 'date',
            header: 'Date',
        },
        {
            accessorKey: 'indentNo',
            header: 'Indent No.',
        },
        {
            accessorKey: 'firmNameMatch',
            header: 'Firm Name',
        },
        {
            accessorKey: 'indenter',
            header: 'Indenter',
        },
        {
            accessorKey: 'department',
            header: 'Department',
        },
        {
            accessorKey: 'specifications',
            header: 'Specifications',
            cell: ({ getValue }) => (
                <div className="max-w-[200px] break-words whitespace-normal">
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'product',
            header: 'Product',
            cell: ({ getValue }) => (
                <div className="max-w-[150px] break-words whitespace-normal">
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'quantity',
            header: 'Quantity',
            cell: ({ row }) => {
                const isEditing = editingRow === row.original.indentNo;
                return isEditing ? (
                    <Input
                        type="number"
                        value={editValues.quantity ?? row.original.quantity}
                        onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                        className="w-20"
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        {row.original.quantity}
                        {user.updateVendorAction && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() => handleEditClick(row.original)}
                            >
                                <PenSquare className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'rate',
            header: 'Rate',
            cell: ({ row }) => {
                const rate = row.original.rate;
                const vendorType = row.original.vendorType;

                if (!rate && vendorType === 'Three Party') {
                    return <span className="text-muted-foreground">Not Decided</span>;
                }
                return <>&#8377;{rate}</>;
            },
        },
        {
            accessorKey: 'uom',
            header: 'UOM',
            cell: ({ row }) => {
                const isEditing = editingRow === row.original.indentNo;
                return isEditing ? (
                    <Input
                        value={editValues.uom ?? row.original.uom}
                        onChange={(e) => handleInputChange('uom', e.target.value)}
                        className="w-20"
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        {row.original.uom}
                        {user.updateVendorAction && editingRow !== row.original.indentNo && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() => handleEditClick(row.original)}
                            >
                                <PenSquare className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'vendorType',
            header: 'Vendor Type',
            cell: ({ row }) => {
                const isEditing = editingRow === row.original.indentNo;
                return isEditing ? (
                    <Select
                        value={editValues.vendorType ?? row.original.vendorType}
                        onValueChange={(value) => handleInputChange('vendorType', value)}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Regular Vendor">Regular</SelectItem>
                            <SelectItem value="Three Party">Three Party</SelectItem>
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="flex items-center gap-2">
                        <Pill
                            variant={
                                row.original.vendorType === 'Regular' ? 'primary' : 'secondary'
                            }
                        >
                            {row.original.vendorType}
                        </Pill>
                        {user.updateVendorAction && editingRow !== row.original.indentNo && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() => handleEditClick(row.original)}
                            >
                                <PenSquare className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'planned2',
            header: 'Planned Date',
            cell: ({ row }) =>
                row.original.planned2
                    ? formatDateTime(row.original.planned2)
                    : '-',
        },
        {
            accessorKey: 'actual2',
            header: 'Actual Date',
            cell: ({ row }) =>
                row.original.actual2
                    ? formatDateTime(row.original.actual2)
                    : '-',
        },
        ...(user.updateVendorAction
            ? [
                {
                    id: 'editActions',
                    cell: ({ row }: { row: Row<HistoryData> }) => {
                        const isEditing = editingRow === row.original.indentNo;
                        return isEditing ? (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleSaveEdit(row.original.indentNo)}
                                >
                                    Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                    Cancel
                                </Button>
                            </div>
                        ) : null;
                    },
                },
            ]
            : []),
    ];

    // Creating Regular Vendor form
 // Update the regularSchema to fix the rateType issue
const regularSchema = z.object({
    vendorName: z.string().min(1, "Vendor name is required"),
    rateType: z.enum(['basic', 'withTax']), // Remove the empty string option
    rate: z.coerce.number().gt(0, "Rate must be greater than 0"),
    withTax: z.enum(['yes', 'no']).optional(),
    gstPercent: z.coerce.number().optional(),
    paymentTerm: z.string().min(1, "Payment term is required"),
});

// Define the proper type for the regular form
type RegularFormValues = z.infer<typeof regularSchema>;

// Fix the useForm hook with proper typing
const regularForm = useForm<RegularFormValues>({
    resolver: zodResolver(regularSchema),
    defaultValues: {
        vendorName: '',
        rateType: 'basic', // Set a default value instead of empty string
        rate: 0,
        withTax: 'no',
        gstPercent: 0,
        paymentTerm: '',
    },
});
const watchRateType = regularForm.watch('rateType');
const watchWithTax = regularForm.watch('withTax');

    async function onSubmitRegular(values: z.infer<typeof regularSchema>) {
    try {
        // Determine values for spreadsheet columns
        const rateTypeText = values.rateType === 'basic' ? 'Basic Rate' : 'With Tax';
        let withTaxOrNot = '';
        let taxValue = 0;
        let finalRate = values.rate;
        
        if (values.rateType === 'basic') {
            if (values.withTax === 'yes') {
                withTaxOrNot = 'Yes';  // ✅ Store "Yes"
                taxValue = 0;
            } else if (values.withTax === 'no') {
                withTaxOrNot = 'No';   // ✅ Store "No"
                taxValue = values.gstPercent || 0;
                // Calculate final rate with GST
                finalRate = values.rate * (1 + taxValue / 100);
            }
        } else {
            // Rate type is "With Tax"
            withTaxOrNot = 'Yes';  // ✅ Store "Yes"
            taxValue = 0;
        }

        await postToSheet(
            indentSheet
                .filter((s) => s.indentNumber === selectedIndent?.indentNo)
                .map((prev) => ({
                    rowIndex: prev.rowIndex,
                    actual2: new Date().toISOString(),
                    vendorName1: values.vendorName,
                    selectRateType1: rateTypeText,           // "Basic Rate" or "With Tax"
                    rate1: values.rate.toString(),            // Original rate entered
                    withTaxOrNot1: withTaxOrNot,             // ✅ "Yes" or "No"
                    taxValue1: taxValue.toString(),           // GST % (0, 5, 12, 18, 28)
                    paymentTerm1: values.paymentTerm,
                    approvedVendorName: values.vendorName,
                    approvedRate: finalRate,                  // Final calculated rate
                    approvedPaymentTerm: values.paymentTerm,
                    lastUpdated: new Date().toISOString(),
                })),
            'update'
        );
        
        toast.success(`Updated vendor of ${selectedIndent?.indentNo}`);
        setOpenDialog(false);
        regularForm.reset();
        setTimeout(() => updateIndentSheet(), 1000);
    } catch (error) {
        console.error('Error updating vendor:', error);
        toast.error('Failed to update vendor');
    }
}

    // Creating Three Party Vendor form
    const threePartySchema = z.object({
    comparisonSheet: z.instanceof(File).optional(),
    productCode: z.string().optional(),
    vendors: z
        .array(
            z.object({
                vendorName: z.string().nonempty(),
                rateType: z.enum(['basic', 'withTax']),
                rate: z.coerce.number().gt(0),
                withTax: z.enum(['yes', 'no']).optional(),
                gstPercent: z.coerce.number().optional(),
                paymentTerm: z.string().nonempty(),
                whatsappNumber: z.string().nonempty(),
                emailId: z.string().email().nonempty(),
            })
        )
        .max(3)
        .min(3),
});

    const threePartyForm = useForm<z.infer<typeof threePartySchema>>({
    resolver: zodResolver(threePartySchema),
    defaultValues: {
        productCode: '',
        vendors: [
            {
                vendorName: '',
                rateType: undefined, // ✅ Not selected by default
                rate: 0,
                withTax: 'no',
                gstPercent: 0,
                paymentTerm: '',
                whatsappNumber: '',
                emailId: '',
            },
            {
                vendorName: '',
                rateType: undefined,
                rate: 0,
                withTax: 'no',
                gstPercent: 0,
                paymentTerm: '',
                whatsappNumber: '',
                emailId: '',
            },
            {
                vendorName: '',
                rateType: undefined,
                rate: 0,
                withTax: 'no',
                gstPercent: 0,
                paymentTerm: '',
                whatsappNumber: '',
                emailId: '',
            },
        ],
    },
});

    const { fields } = useFieldArray({
        control: threePartyForm.control,
        name: 'vendors',
    });

    async function onSubmitThreeParty(values: z.infer<typeof threePartySchema>) {
    try {
        let url: string = '';

        if (values.comparisonSheet) {
            url = await uploadFile({
                file: values.comparisonSheet,
                folderId: import.meta.env.VITE_COMPARISON_SHEET_FOLDER,
            });
        }

        // Process each vendor's rate type data
        const processVendorData = (vendor: typeof values.vendors[0]) => {
            const rateTypeText = vendor.rateType === 'basic' ? 'Basic Rate' : 'With Tax';
            let withTaxOrNot = '';
            let taxValue = 0;
            
            if (vendor.rateType === 'basic') {
                if (vendor.withTax === 'yes') {
                    withTaxOrNot = 'Yes';
                    taxValue = 0;
                } else if (vendor.withTax === 'no') {
                    withTaxOrNot = 'No';
                    taxValue = vendor.gstPercent || 0;
                }
            } else {
                withTaxOrNot = 'Yes';
                taxValue = 0;
            }

            return {
                rateType: rateTypeText,
                rate: vendor.rate,
                withTaxOrNot,
                taxValue,
            };
        };

        const vendor1Data = processVendorData(values.vendors[0]);
        const vendor2Data = processVendorData(values.vendors[1]);
        const vendor3Data = processVendorData(values.vendors[2]);

        await postToSheet(
            indentSheet
                .filter((s) => s.indentNumber === selectedIndent?.indentNo)
                .map((prev) => ({
                    rowIndex: prev.rowIndex,
                    actual2: new Date().toISOString(),
                    
                    // Vendor 1 - Matching your spreadsheet columns exactly
                    vendorName1: values.vendors[0].vendorName,
                    selectRateType1: vendor1Data.rateType,        // "Select Rate Type 1"
                    rate1: vendor1Data.rate.toString(),            // "Rate 1"
                    withTaxOrNot1: vendor1Data.withTaxOrNot,      // "With Tax or Not 1"
                    taxValue1: vendor1Data.taxValue.toString(),    // "Tax Value 1"
                    paymentTerm1: values.vendors[0].paymentTerm,   // "Payment Term 1"
                    whatsappNumber1: values.vendors[0].whatsappNumber, // "Whatsapp Number 1"
                    emailId1: values.vendors[0].emailId,           // "Email Id 1"
                    
                    // Vendor 2 - Matching your spreadsheet columns exactly
                    vendorName2: values.vendors[1].vendorName,     // "Vendor Name 2"
                    selectRateType2: vendor2Data.rateType,        // "Select Rate Type 2"
                    rate2: vendor2Data.rate.toString(),            // "Rate 2"
                    withTaxOrNot2: vendor2Data.withTaxOrNot,      // "With Tax or Not 2"
                    taxValue2: vendor2Data.taxValue.toString(),    // "Tax Value 2"
                    paymentTerm2: values.vendors[1].paymentTerm,   // "Payment Term 2"
                    whatsappNumber2: values.vendors[1].whatsappNumber, // "Whatsapp Number 2"
                    emailId2: values.vendors[1].emailId,           // "Email Id 2"
                    
                    // Vendor 3 - Matching your spreadsheet columns exactly
                    vendorName3: values.vendors[2].vendorName,     // "Vendor Name 3"
                    selectRateType3: vendor3Data.rateType,        // "Select Rate Type 3"
                    rate3: vendor3Data.rate.toString(),            // "Rate 3"
                    withTaxOrNot3: vendor3Data.withTaxOrNot,      // "With Tax or Not 3"
                    taxValue3: vendor3Data.taxValue.toString(),    // "Tax Value 3"
                    paymentTerm3: values.vendors[2].paymentTerm,   // "Payment Term 3"
                    whatsappNumber3: values.vendors[2].whatsappNumber, // "Whatsapp Number 3"
                    emailId3: values.vendors[2].emailId,           // "Email Id 3"
                    
                    comparisonSheet: url,
                    productCode: values.productCode || '',
                    lastUpdated: new Date().toISOString(),
                })),
            'update'
        );
        
        toast.success(`Updated vendors of ${selectedIndent?.indentNo}`);
        setOpenDialog(false);
        threePartyForm.reset();
        setTimeout(() => updateIndentSheet(), 1000);
    } catch (error) {
        console.error('Error updating vendors:', error);
        toast.error('Failed to update vendors');
    }
}

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const seconds = date.getSeconds().toString().padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    // History Update form
    const historyUpdateSchema = z.object({
        rate: z.coerce.number(),
    });

    const historyUpdateForm = useForm({
        resolver: zodResolver(historyUpdateSchema),
        defaultValues: {
            rate: 0,
        },
    });

    useEffect(() => {
        if (selectedHistory) {
            historyUpdateForm.reset({ rate: selectedHistory.rate });
        }
    }, [selectedHistory]);

    async function onSubmitHistoryUpdate(values: z.infer<typeof historyUpdateSchema>) {
        try {
            await postToSheet(
                indentSheet
                    .filter((s) => s.indentNumber === selectedHistory?.indentNo)
                    .map((prev) => ({
                        rowIndex: prev.rowIndex,
                        rate1: values.rate.toString(),
                        approvedRate: values.rate,
                        lastUpdated: new Date().toISOString(),
                    })),
                'update'
            );
            toast.success(`Updated rate of ${selectedHistory?.indentNo}`);
            setOpenDialog(false);
            historyUpdateForm.reset({ rate: undefined });
            setTimeout(() => updateIndentSheet(), 1000);
        } catch {
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
                        heading="Vendor Rate Update"
                        subtext="Update vendors for Regular and Three Party indents"
                        tabs
                    >
                        <UserCheck size={50} className="text-primary" />
                    </Heading>
                   <TabsContent value="pending">
  {/* Compact Centered Filters for Pending Tab */}
  <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center justify-center p-4 bg-muted/30 rounded-lg border">
    {/* Date Filter */}
    <div className="w-full sm:w-auto">
  <div className="flex gap-2 items-center">
    {/* <Calendar className="w-4 h-4 text-muted-foreground" /> */}
    <Input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      className="w-32 sm:w-36"
      placeholder="Select Date"
    />
    {selectedDate && (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setSelectedDate('')}
        className="h-9 w-9"
      >
        <X className="h-3 w-3" />
      </Button>
    )}
  </div>
</div>
    {/* UOM Filter */}
    <div className="w-full sm:w-auto">
      <Select value={selectedUOM} onValueChange={setSelectedUOM}>
        <SelectTrigger className="w-32 sm:w-36">
          <SelectValue placeholder="UOM" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All UOMs</SelectItem>
          {uniqueUOMs.map((uom) => (
            <SelectItem key={uom} value={uom}>
              {uom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Search */}
    <div className="w-full sm:flex-1 max-w-md">
      <div className="relative">
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-9"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
    </div>

    {/* Clear All Button */}
    {(selectedDate || selectedUOM || searchQuery) && (
      <Button
        variant="outline"
        onClick={clearAllFilters}
        className="w-full sm:w-auto flex items-center gap-2"
      >
        <Filter className="h-3 w-3" />
        Clear
      </Button>
    )}
  </div>

  <DataTable
    data={filteredTableData}
    columns={columns}
    searchFields={[]}
    dataLoading={indentLoading}
  />
</TabsContent>

                    <TabsContent value="history">
  {/* Compact Centered Filters for History Tab */}
  <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center justify-center p-4 bg-muted/30 rounded-lg border">
    {/* Date Filter */}
    <div className="w-full sm:w-auto">
  <div className="flex gap-2 items-center">
    {/* <Calendar className="w-4 h-4 text-muted-foreground" /> */}
    <Input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      className="w-32 sm:w-36"
      placeholder="Select Date"
    />
    {selectedDate && (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setSelectedDate('')}
        className="h-9 w-9"
      >
        <X className="h-3 w-3" />
      </Button>
    )}
  </div>
</div>

    {/* UOM Filter */}
    <div className="w-full sm:w-auto">
      <Select value={selectedHistoryUOM} onValueChange={setSelectedHistoryUOM}>
        <SelectTrigger className="w-32 sm:w-36">
          <SelectValue placeholder="UOM" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All UOMs</SelectItem>
          {uniqueHistoryUOMs.map((uom) => (
            <SelectItem key={uom} value={uom}>
              {uom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Search */}
    <div className="w-full sm:flex-1 max-w-md">
      <div className="relative">
        <Input
          placeholder="Search..."
          value={historySearchQuery}
          onChange={(e) => setHistorySearchQuery(e.target.value)}
          className="pr-9"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
    </div>

    {/* Clear All Button */}
    {(selectedHistoryDate || selectedHistoryUOM || historySearchQuery) && (
      <Button
        variant="outline"
        onClick={clearAllHistoryFilters}
        className="w-full sm:w-auto flex items-center gap-2"
      >
        <Filter className="h-3 w-3" />
        Clear
      </Button>
    )}
  </div>

  <DataTable
    data={filteredHistoryData}
    columns={historyColumns}
    searchFields={[]}
    dataLoading={indentLoading}
  />
</TabsContent>
                </Tabs>
                {selectedIndent &&
                    (selectedIndent.vendorType === 'Three Party' ? (
                        <DialogContent>
                            <Form {...threePartyForm}>
                                <form
                                    onSubmit={threePartyForm.handleSubmit(
                                        onSubmitThreeParty,
                                        onError
                                    )}
                                    className="space-y-7"
                                >
                                    <DialogHeader className="space-y-1">
                                        <DialogTitle>Three Party Vendors</DialogTitle>
                                        <DialogDescription>
                                            Update vendors for{' '}
                                            <span className="font-medium">
                                                {selectedIndent.indentNo}
                                            </span>
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted py-2 px-5 rounded-md ">
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
                                    <Tabs
                                        defaultValue="0"
                                        className="grid gap-5 p-4 border rounded-md"
                                    >
                                        <TabsList className="w-full p-1">
                                            <TabsTrigger value="0">Vendor 1</TabsTrigger>
                                            <TabsTrigger value="1">Vendor 2</TabsTrigger>
                                            <TabsTrigger value="2">Vendor 3</TabsTrigger>
                                        </TabsList>
                                        {fields.map((field, index) => {
    const watchVendorRateType = threePartyForm.watch(`vendors.${index}.rateType`);
    const watchVendorWithTax = threePartyForm.watch(`vendors.${index}.withTax`);
    
    return (
        <TabsContent value={`${index}`} key={field.id}>
            <div className="grid gap-3">
                {/* Vendor Name - Full Width */}
                <FormField
                    control={threePartyForm.control}
                    name={`vendors.${index}.vendorName`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Vendor Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter vendor name"
                                    {...field}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                {/* Rate Type and Rate - Same Line */}
                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        control={threePartyForm.control}
                        name={`vendors.${index}.rateType`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rate Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select rate type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="basic">Basic Rate</SelectItem>
                                        <SelectItem value="withTax">With Tax</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={threePartyForm.control}
                        name={`vendors.${index}.rate`}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {watchVendorRateType === 'basic' ? 'Basic Rate' : 'Rate (With Tax)'}
                                </FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

                {/* With Tax and GST % - Same Line (Only when Basic Rate) */}
                {watchVendorRateType === 'basic' && (
                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            control={threePartyForm.control}
                            name={`vendors.${index}.withTax`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>With Tax?</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select option" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="yes">Yes</SelectItem>
                                            <SelectItem value="no">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                        {watchVendorWithTax === 'no' && (
                            <FormField
                                control={threePartyForm.control}
                                name={`vendors.${index}.gstPercent`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>GST %</FormLabel>
                                        <Select 
                                            onValueChange={(value) => field.onChange(Number(value))} 
                                            value={field.value?.toString()}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select GST %" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="5">5%</SelectItem>
                                                {/* <SelectItem value="12">12%</SelectItem> */}
                                                <SelectItem value="18">18%</SelectItem>
                                                <SelectItem value="40">40%</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                )}

                {/* Payment Term, WhatsApp, Email - Keep as is */}
                <FormField
                    control={threePartyForm.control}
                    name={`vendors.${index}.paymentTerm`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Payment Term</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select payment term" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {options?.paymentTerms?.map((term, i) => (
                                        <SelectItem key={i} value={term}>
                                            {term}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />

                <FormField
                    control={threePartyForm.control}
                    name={`vendors.${index}.whatsappNumber`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>WhatsApp Number</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Enter WhatsApp number"
                                    {...field}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={threePartyForm.control}
                    name={`vendors.${index}.emailId`}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email ID</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder="Enter email ID"
                                    {...field}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
        </TabsContent>
    );
})}

                                    </Tabs>
                                    <FormField
                                        control={threePartyForm.control}
                                        name="comparisonSheet"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Comparison Sheet</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="file"
                                                        onChange={(e) =>
                                                            field.onChange(e.target.files?.[0])
                                                        }
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    {/* <FormField
                                        control={threePartyForm.control}
                                        name="productCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Product Code</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Enter product code"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    /> */}

                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline">Close</Button>
                                        </DialogClose>

                                        <Button
                                            type="submit"
                                            disabled={threePartyForm.formState.isSubmitting}
                                        >
                                            {threePartyForm.formState.isSubmitting && (
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
                    ) : (
                        <DialogContent>
                            <Form {...regularForm}>
                                <form
                                    onSubmit={regularForm.handleSubmit(onSubmitRegular, onError)}
                                    className="space-y-5"
                                >
                                    <DialogHeader className="space-y-1">
                                        <DialogTitle>Regular Vendor</DialogTitle>
                                        <DialogDescription>
                                            Update vendor for{' '}
                                            <span className="font-medium">
                                                {selectedIndent.indentNo}
                                            </span>
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-3 bg-muted p-2 rounded-md ">
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
                                        <div className="space-y-1">
                                        <p className="font-medium">Quantity</p>
                                         <p className="text-sm font-light">{selectedIndent.quantity} {selectedIndent.uom}</p>
                                             </div>
                                    </div>
                                    <div className="grid gap-3">
    {/* Vendor Name - Full Width */}
    <FormField
        control={regularForm.control}
        name="vendorName"
        render={({ field }) => (
            <FormItem>
                <FormLabel>Vendor Name</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <Input
                            placeholder="Search vendor..."
                            className="mb-2"
                            onChange={(e) => {
                                const searchValue = e.target.value.toLowerCase();
                                const items = document.querySelectorAll('[role="option"]');
                                items.forEach((item) => {
                                    const text = item.textContent?.toLowerCase() || '';
                                    (item as HTMLElement).style.display =
                                        text.includes(searchValue) ? 'flex' : 'none';
                                });
                            }}
                        />
                        {options?.vendors?.map(({ vendorName }, i) => (
                            <SelectItem key={i} value={vendorName}>
                                {vendorName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormItem>
        )}
    />

    {/* Rate Type - Full Width (same as vendor name) */}
    <FormField
    control={regularForm.control}
    name="rateType"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Rate Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                    <SelectTrigger className="w-full">  {/* ✅ Added w-full */}
                        <SelectValue placeholder="Select rate type" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="basic">Basic Rate</SelectItem>
                    <SelectItem value="withTax">With Tax</SelectItem>
                </SelectContent>
            </Select>
        </FormItem>
    )}
/>

    {/* Basic Rate - Full Width (same as vendor name) */}
    <FormField
        control={regularForm.control}
        name="rate"
        render={({ field }) => (
            <FormItem>
                <FormLabel>
                    {watchRateType === 'basic' ? 'Basic Rate' : watchRateType === 'withTax' ? 'Rate (With Tax)' : 'Rate'}
                </FormLabel>
                <FormControl>
                    <Input type="number" className="w-full" {...field} />
                </FormControl>
            </FormItem>
        )}
    />

    {/* With Tax and GST % - Full Width when shown */}
    {watchRateType === 'basic' && (
        <>
            <FormField
                control={regularForm.control}
                name="withTax"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>With Tax?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select option" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />

            {watchWithTax === 'no' && (
                <FormField
                    control={regularForm.control}
                    name="gstPercent"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>GST %</FormLabel>
                            <Select 
                                onValueChange={(value) => field.onChange(Number(value))} 
                                value={field.value?.toString()}
                            >
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select GST %" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="5">5%</SelectItem>
                                    {/* <SelectItem value="12">12%</SelectItem> */}
                                    <SelectItem value="18">18%</SelectItem>
                                    <SelectItem value="40">40%</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
            )}
        </>
    )}

    {/* Payment Term - Full Width */}
    <FormField
        control={regularForm.control}
        name="paymentTerm"
        render={({ field }) => (
            <FormItem>
                <FormLabel>Payment Term</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select payment term" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {options?.paymentTerms?.map((term, i) => (
                            <SelectItem key={i} value={term}>
                                {term}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
                                            disabled={regularForm.formState.isSubmitting}
                                        >
                                            {regularForm.formState.isSubmitting && (
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
                    ))}

                {selectedHistory && selectedHistory.vendorType === 'Regular' && (
                    <DialogContent>
                        <Form {...historyUpdateForm}>
                            <form
                                onSubmit={historyUpdateForm.handleSubmit(
                                    onSubmitHistoryUpdate,
                                    onError
                                )}
                                className="space-y-7"
                            >
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
