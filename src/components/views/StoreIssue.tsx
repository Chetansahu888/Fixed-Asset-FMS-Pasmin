import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { ClipLoader as Loader } from 'react-spinners';
import { ClipboardList, Trash, Search } from 'lucide-react';
import { postToIssueSheet, postToSheet, uploadFile } from '@/lib/fetchers';
import type { IndentSheet } from '@/types';

import type { IssueSheet } from '@/types';
import { useSheets } from '@/context/SheetsContext';
import Heading from '../element/Heading';
import { useEffect, useState } from 'react';

export default () => {
    // const { indentSheet: sheet, updateIndentSheet, masterSheet: options } = useSheets();

    const { issueSheet: sheet, updateIssueSheet, masterSheet: options } = useSheets();
    const [issueSheet, setIssueSheet] = useState<IssueSheet[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchTermGroupHead, setSearchTermGroupHead] = useState('');
    const [searchTermProductName, setSearchTermProductName] = useState('');
    const [searchTermUOM, setSearchTermUOM] = useState('');



    useEffect(() => {
        setIssueSheet(sheet);
    }, [sheet]);

    const schema = z.object({
        products: z
            .array(
                z.object({
                    department: z.string().nonempty(),
                    groupHead: z.string().nonempty(),
                    productName: z.string().nonempty(),
                    quantity: z.coerce.number().gt(0, 'Must be greater than 0'),
                    uom: z.string().nonempty(),
                    specifications: z.string().optional(),
                    givenQuantity: z.coerce.number().gt(0, 'Must be greater than 0').optional(),
                })
            )
            .min(1, 'At least one product is required'),
    });

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            // indenterName: '',
            // indentApproveBy: '',
            // indentType: undefined,
            products: [
                {
                    // attachment: undefined,
                    uom: '',
                    productName: '',
                    specifications: '',
                    quantity: 1,
                    // areaOfUse: '',
                    groupHead: '',
                    department: '',
                },
            ],
        },
    });

    const products = form.watch('products');
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'products',
    });

    async function onSubmit(data: z.infer<typeof schema>) {
        try {
            // Helper: find next issue number based on last available issue number
            const getNextIssueNumber = (existingIssues: Partial<IssueSheet>[]) => {
                if (!Array.isArray(existingIssues) || existingIssues.length === 0) return 'IS-0001';

                const availableNumbers = existingIssues
                    .filter((issue) => issue.issueNo && typeof issue.issueNo === 'string') // Changed from issueNumber to issueNo
                    .map((issue) => issue.issueNo!)
                    .filter((num) => /^IS-\d+$/.test(num))
                    .map((num) => parseInt(num.split('-')[1], 10));

                if (availableNumbers.length === 0) return 'IS-0001';

                const lastIssueNumber = Math.max(...availableNumbers);
                return `IS-${String(lastIssueNumber + 1).padStart(4, '0')}`;
            };

            const nextIssueNumber = getNextIssueNumber(issueSheet || []);

            // console.log('nextIssueNumber', nextIssueNumber);

            const rows: Partial<IssueSheet>[] = [];
            for (const product of data.products) {
                const row: Partial<IssueSheet> = {
                    timestamp: new Date().toISOString(),
                    issueNo: nextIssueNumber, // Changed from issueNumber to issueNo
                    issueTo: product.specifications || '', // Map specifications to issueTo
                    uom: product.uom,
                    groupHead: product.groupHead,
                    productName: product.productName,
                    quantity: product.quantity,
                    department: product.department, // Map department to storeStatus
                };

                rows.push(row);
            }

            await postToIssueSheet(rows);

            setTimeout(() => updateIssueSheet(), 1000);

            toast.success('Issue created successfully');

            form.reset({
                products: [
                    {
                        uom: '',
                        productName: '',
                        specifications: '',
                        quantity: 1,
                        groupHead: '',
                        department: '',
                    },
                ],
            });
        } catch (error) {
            console.error('Error in onSubmit:', error);
            toast.error('Error while creating issue! Please try again');
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    // console.log('fields', fields);

    return (
        <div>
            <Heading heading="Stor Issue" subtext="Create new Issue">
                <ClipboardList size={50} className="text-primary" />
            </Heading>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6 p-5">


                    <div className="space-y-4">
                        {fields.map((field, index) => {
                            const groupHead = products[index]?.groupHead;
                            const department = products[index]?.department;
                            const productOptions = options?.groupHeads[groupHead] || [];

                            return (
                                <div
                                    key={field.id}
                                    className="flex flex-col gap-4 border p-4 rounded-lg"
                                >
                                    <div className="flex justify-between">
                                        <h3 className="text-md font-semibold">Product</h3>
                                    </div>
                                    <div className="grid gap-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.department`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Department
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select department" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {/* 🔍 Search Box */}
                                                                <div className="flex items-center border-b px-3 pb-3">
                                                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    <input
                                                                        placeholder="Search departments..."
                                                                        value={searchTerm}
                                                                        onChange={(e) =>
                                                                            setSearchTerm(
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        onKeyDown={(e) =>
                                                                            e.stopPropagation()
                                                                        }
                                                                        className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                                                    />
                                                                </div>

                                                                {/* Filtered List */}
                                                                {(options?.departments || [])
                                                                    .filter((dep) =>
                                                                        dep
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                searchTerm.toLowerCase()
                                                                            )
                                                                    )
                                                                    .map((dep, i) => (
                                                                        <SelectItem
                                                                            key={i}
                                                                            value={dep}
                                                                        >
                                                                            {dep}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />


                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.groupHead`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Group Head
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select group head" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {/* 🔍 Search Box */}
                                                                <div className="flex items-center border-b px-3 pb-3">
                                                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    <input
                                                                        placeholder="Search group heads..."
                                                                        value={searchTermGroupHead}
                                                                        onChange={(e) =>
                                                                            setSearchTermGroupHead(
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        onKeyDown={(e) =>
                                                                            e.stopPropagation()
                                                                        } // ✅ Prevent 1-letter freeze
                                                                        className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                                                    />
                                                                </div>

                                                                {/* Filtered List */}
                                                                {Object.keys(
                                                                    options?.groupHeads || {}
                                                                )
                                                                    .filter((dep) =>
                                                                        dep
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                searchTermGroupHead.toLowerCase()
                                                                            )
                                                                    )
                                                                    .map((dep, i) => (
                                                                        <SelectItem
                                                                            key={i}
                                                                            value={dep}
                                                                        >
                                                                            {dep}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                            {/* <FormField
                                                control={form.control}
                                                name={`products.${index}.areaOfUse`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Area Of Use
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter area of user"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            /> */}

                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.productName`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Product Name
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            disabled={!groupHead}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select product" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {/* 🔍 Search Box */}
                                                                <div className="flex items-center border-b px-3 pb-3">
                                                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    <input
                                                                        placeholder="Search products..."
                                                                        value={
                                                                            searchTermProductName
                                                                        }
                                                                        onChange={(e) =>
                                                                            setSearchTermProductName(
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        onKeyDown={(e) =>
                                                                            e.stopPropagation()
                                                                        } // ✅ Freeze fix
                                                                        className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                                                    />
                                                                </div>

                                                                {/* Filtered List */}
                                                                {productOptions
                                                                    .filter((dep) =>
                                                                        dep
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                searchTermProductName.toLowerCase()
                                                                            )
                                                                    )
                                                                    .map((dep, i) => (
                                                                        <SelectItem
                                                                            key={i}
                                                                            value={dep}
                                                                        >
                                                                            {dep}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Quantity
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                disabled={!groupHead}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />


                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.uom`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            UOM
                                                            <span className="text-destructive">*</span>
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            disabled={!groupHead}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select UOM" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {/* 🔍 Search Box */}
                                                                <div className="flex items-center border-b px-3 pb-3">
                                                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    <input
                                                                        placeholder="Search UOM..."
                                                                        value={searchTermUOM}
                                                                        onChange={(e) =>
                                                                            setSearchTermUOM(e.target.value)
                                                                        }
                                                                        onKeyDown={(e) => e.stopPropagation()}
                                                                        className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                                                    />
                                                                </div>

                                                                {/* Fixed: Use options?.uoms instead of options?.paymentTerms */}
                                                                {(options?.uoms || [])
                                                                    .filter((uom) =>
                                                                        uom
                                                                            .toLowerCase()
                                                                            .includes(searchTermUOM.toLowerCase())
                                                                    )
                                                                    .map((uom, i) => (
                                                                        <SelectItem key={i} value={uom}>
                                                                            {uom}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* <FormField
                                            control={form.control}
                                            name={`products.${index}.attachment`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Attachment</FormLabel>
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
                                        /> */}

                                        <FormField
                                            control={form.control}
                                            name={`products.${index}.specifications`}
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel>Issue to</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Enter specifications"
                                                            className="resize-y" // or "resize-y" to allow vertical resizing
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div>
                        <Button
                            className="w-full"
                            type="submit"
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting && (
                                <Loader size={20} color="white" aria-label="Loading Spinner" />
                            )}
                            Create Indent
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};
