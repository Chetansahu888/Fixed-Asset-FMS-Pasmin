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
import { postToSheet, uploadFile } from '@/lib/fetchers';
import type { IndentSheet } from '@/types';
import { useSheets } from '@/context/SheetsContext';
import Heading from '../element/Heading';
import { useEffect, useState } from 'react';

export default () => {
    const { indentSheet: sheet, updateIndentSheet, masterSheet: options } = useSheets();
    const [indentSheet, setIndentSheet] = useState<IndentSheet[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchTermGroupHead, setSearchTermGroupHead] = useState('');
    const [searchTermProductName, setSearchTermProductName] = useState('');
    const [searchTermUOM, setSearchTermUOM] = useState('');
    const [searchTermFirmName, setSearchTermFirmName] = useState('');
    useEffect(() => {
        setIndentSheet(sheet);
    }, [sheet]);

    const schema = z.object({
        indenterName: z.string().nonempty(),
        // indentApproveBy: z.string().nonempty(),
        // indentType: z.enum(['Purchase', 'Store Out'], { required_error: 'Select a status' }),
        indentStatus: z.enum(['Critical', 'None Critical'], {
            required_error: 'Select indent status',
        }), // Add this line
        products: z
            .array(
                z.object({
                    department: z.string().nonempty(),
                    groupHead: z.string().nonempty(),
                    productName: z.string().nonempty(),
                    quantity: z.coerce.number().gt(0, 'Must be greater than 0'),
                    uom: z.string().nonempty(),
                    firmName: z.string().nonempty(),
                    areaOfUse: z.string().nonempty(),
                    numberOfDays: z.coerce.number().gt(0, 'Must be greater than 0'),
                    attachment: z.instanceof(File).optional(),
                    specifications: z.string().optional(),
                })
            )
            .min(1, 'At least one product is required'),
    });

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            indenterName: '',
            // indentApproveBy: '',
            // indentType: undefined,
            indentStatus: undefined,
            products: [
                {
                    attachment: undefined,
                    uom: '',
                    firmName: '',
                    productName: '',
                    specifications: '',
                    quantity: 1,
                    areaOfUse: '',
                    numberOfDays: 1,
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

   // ... imports and other code remains the same ...

async function onSubmit(data: z.infer<typeof schema>) {
    try {
        // Helper: find next indent number based on last available indent number
        const getNextIndentNumber = (existingIndents: Partial<IndentSheet>[]) => {
            if (!Array.isArray(existingIndents) || existingIndents.length === 0)
                return 'SI-0001';

            // Get all available indent numbers (only existing rows in sheet)
            const availableNumbers = existingIndents
                .filter(
                    (indent) => indent.indentNumber && typeof indent.indentNumber === 'string'
                )
                .map((indent) => indent.indentNumber!)
                .filter((num) => /^SI-\d+$/.test(num))
                .map((num) => parseInt(num.split('-')[1], 10));

            // If no valid numbers found, start from 1
            if (availableNumbers.length === 0) return 'SI-0001';

            // Find the highest/last available indent number and increment by 1
            const lastIndentNumber = Math.max(...availableNumbers);
            return `SI-${String(lastIndentNumber + 1).padStart(4, '0')}`;
        };

        // IMPORTANT: Fresh data sheet se le lo before generating indent number
        await updateIndentSheet(); // Pehle fresh data load karo

        // Wait for state to update
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Ab fresh data ke saath indent number generate karo
        const nextIndentNumber = getNextIndentNumber(indentSheet || []);

        const rows: Partial<IndentSheet>[] = [];
        for (const product of data.products) {
            const row: Partial<IndentSheet> = {
                timestamp: new Date().toISOString(),
                indentNumber: nextIndentNumber,
                indenterName: data.indenterName,
                department: product.department,
                areaOfUse: product.areaOfUse,
                groupHead: product.groupHead,
                productName: product.productName,
                quantity: product.quantity,
                uom: product.uom,
                firmName: product.firmName,
                specifications: product.specifications || '',
                indentStatus: data.indentStatus,
                noDay: product.numberOfDays,
            };

            // ✅ FIXED: Check if attachment exists and is a valid File object
            if (product.attachment && product.attachment instanceof File) {
                try {
                    row.attachment = await uploadFile({
                        file: product.attachment, // ✅ ADDED: Pass the file parameter
                        folderId: import.meta.env.VITE_IDENT_ATTACHMENT_FOLDER
                    });
                } catch (uploadError) {
                    console.error('File upload failed:', uploadError);
                    // Continue without attachment if upload fails
                    row.attachment = 'Upload Failed';
                }
            }

            rows.push(row);
        }

        await postToSheet(rows);
        setTimeout(() => updateIndentSheet(), 1000);

        toast.success('Indent created successfully');

        form.reset({
            indenterName: '',
            indentStatus: undefined,
            products: [
                {
                    attachment: undefined,
                    uom: '',
                    firmName: '',
                    productName: '',
                    specifications: '',
                    quantity: 1,
                    areaOfUse: '',
                    numberOfDays: 1,
                    groupHead: '',
                    department: '',
                },
            ],
        });
    } catch (error) {
        console.error('Error in onSubmit:', error);
        toast.error('Error while creating indent! Please try again');
    }
}

// ... rest of the code remains the same ...
    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    return (
        <div>
            <Heading heading="Indent Form" subtext="Create new Indent">
                <ClipboardList size={50} className="text-primary" />
            </Heading>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6 p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <FormField
                            control={form.control}
                            name="indenterName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Indenter Name
                                        <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter indenter name" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="indentStatus"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Indent Status
                                        <span className="text-destructive">*</span>
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Critical">Critical</SelectItem>
                                            <SelectItem value="None Critical">
                                                None Critical
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Products</h2>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    append({
                                        department: '',
                                        groupHead: '',
                                        productName: '',
                                        quantity: 1,
                                        uom: '',
                                        firmName: '',
                                        areaOfUse: '',
                                        numberOfDays: 1,
                                        // @ts-ignore
                                        priority: undefined,
                                        attachment: undefined,
                                        specifications: '',
                                    })
                                }
                            >
                                Add Product
                            </Button>
                        </div>

                        {fields.map((field, index) => {
                            const groupHead = products[index]?.groupHead;
                            const productOptions = options?.groupHeads[groupHead] || [];

                            return (
                                <div
                                    key={field.id}
                                    className="flex flex-col gap-4 border p-4 rounded-lg"
                                >
                                    <div className="flex justify-between">
                                        <h3 className="text-md font-semibold">
                                            Product {index + 1}
                                        </h3>
                                        <Button
                                            variant="destructive"
                                            type="button"
                                            onClick={() => fields.length > 1 && remove(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash />
                                        </Button>
                                    </div>
                                    <div className="grid gap-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.department`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Location
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
                                                                        } // ✅ Prevent 1-letter freeze
                                                                        className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                                                    />
                                                                </div>

                                                                {/* Filtered List */}
                                                                {options?.departments
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
                                            <FormField
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
                                            />
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

                                                                {/* Filtered List */}
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


                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.numberOfDays`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Numbers of Days
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
                                                name={`products.${index}.firmName`}  // CHANGE FROM uom TO firmName
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Firm Name
                                                            <span className="text-destructive">*</span>
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            disabled={!groupHead}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Select Firm Name" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {/* 🔍 Search Box */}
                                                                <div className="flex items-center border-b px-3 pb-3">
                                                                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    <input
                                                                        placeholder="Search Firm Name..."  // CHANGE PLACEHOLDER
                                                                        value={searchTermFirmName}  // CHANGE STATE
                                                                        onChange={(e) => setSearchTermFirmName(e.target.value)}  // CHANGE SETTER
                                                                        onKeyDown={(e) => e.stopPropagation()}
                                                                        className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                                                    />
                                                                </div>

                                                                {/* Filtered List */}
                                                                {(options?.firms || [])
                                                                    .filter((firm) =>  // CHANGE VARIABLE NAME
                                                                        firm
                                                                            .toLowerCase()
                                                                            .includes(searchTermFirmName.toLowerCase())  // CHANGE STATE
                                                                    )
                                                                    .map((firm, i) => (  // CHANGE VARIABLE NAME
                                                                        <SelectItem key={i} value={firm}>
                                                                            {firm}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />

                                        </div>
                                        <FormField
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
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`products.${index}.specifications`}
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel>Specifications</FormLabel>
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
