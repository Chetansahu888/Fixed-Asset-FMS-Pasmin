import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
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
import { ClipboardList, Trash, Search, Plus, FileText } from 'lucide-react';
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
        indentStatus: z.enum(['Critical', 'None Critical'], {
            required_error: 'Select indent status',
        }),
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

    async function onSubmit(data: z.infer<typeof schema>) {
        try {
            const getNextIndentNumber = (existingIndents: Partial<IndentSheet>[]) => {
                if (!Array.isArray(existingIndents) || existingIndents.length === 0)
                    return 'SI-0001';

                const availableNumbers = existingIndents
                    .filter(
                        (indent) => indent.indentNumber && typeof indent.indentNumber === 'string'
                    )
                    .map((indent) => indent.indentNumber!)
                    .filter((num) => /^SI-\d+$/.test(num))
                    .map((num) => parseInt(num.split('-')[1], 10));

                if (availableNumbers.length === 0) return 'SI-0001';

                const lastIndentNumber = Math.max(...availableNumbers);
                return `SI-${String(lastIndentNumber + 1).padStart(4, '0')}`;
            };

            await updateIndentSheet();
            await new Promise((resolve) => setTimeout(resolve, 500));

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

                if (product.attachment && product.attachment instanceof File) {
                    try {
                        row.attachment = await uploadFile({
                            file: product.attachment,
                            folderId: import.meta.env.VITE_IDENT_ATTACHMENT_FOLDER
                        });
                    } catch (uploadError) {
                        console.error('File upload failed:', uploadError);
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

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
            <div className="max-w-7xl mx-auto">
                <Heading heading="Indent Form" subtext="Create new Indent">
                    <ClipboardList size={50} className="text-green-600" />
                </Heading>
                
                <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8 p-8">
                            {/* Header Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="indenterName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-lg font-bold text-gray-800">
                                                Indenter Name *
                                            </FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Enter Indenter name" 
                                                    {...field} 
                                                    className="h-12 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 transition-colors"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-red-500 font-medium" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="indentStatus"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-lg font-bold text-gray-800">
                                                Indent Status *
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 transition-colors">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="border-2 border-gray-200 rounded-xl shadow-lg">
                                                    <SelectItem value="Critical" className="text-lg py-3">
                                                        <span className="text-red-600 font-semibold">Critical</span>
                                                    </SelectItem>
                                                    <SelectItem value="None Critical" className="text-lg py-3">
                                                        <span className="text-green-600 font-semibold">None Critical</span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-red-500 font-medium" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Products Section */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center pb-4 border-b-2 border-gray-200">
                                    <h2 className="text-2xl font-bold text-gray-800">Products</h2>
                                    <Button
                                        type="button"
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
                                                attachment: undefined,
                                                specifications: '',
                                            })
                                        }
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                                    >
                                        <Plus className="mr-2" size={20} />
                                        Add Product
                                    </Button>
                                </div>

                                {fields.map((field, index) => {
                                    const groupHead = products[index]?.groupHead;
                                    const productOptions = options?.groupHeads[groupHead] || [];

                                    return (
                                        <div
                                            key={field.id}
                                            className="border-2 border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-lg"
                                        >
                                            <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
                                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                                    <FileText className="text-green-600" size={24} />
                                                    Product {index + 1}
                                                </h3>
                                                <Button
                                                    variant="destructive"
                                                    type="button"
                                                    onClick={() => fields.length > 1 && remove(index)}
                                                    disabled={fields.length === 1}
                                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                                >
                                                    <Trash size={18} />
                                                </Button>
                                            </div>
                                            
                                            <div className="grid gap-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {/* Department */}
                                                    <FormField
                                                        control={form.control}
                                                        name={`products.${index}.department`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold text-gray-700">
                                                                    Location *
                                                                </FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl focus:border-green-500 transition-colors">
                                                                            <SelectValue placeholder="Select department" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className="border-2 border-gray-200 rounded-xl shadow-lg">
                                                                        <div className="flex items-center border-b-2 border-gray-200 px-3 pb-3">
                                                                            <Search className="mr-2 h-4 w-4 text-gray-500" />
                                                                            <input
                                                                                placeholder="Search departments..."
                                                                                value={searchTerm}
                                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                                                onKeyDown={(e) => e.stopPropagation()}
                                                                                className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 font-medium"
                                                                            />
                                                                        </div>
                                                                        {options?.departments
                                                                            .filter((dep) =>
                                                                                dep.toLowerCase().includes(searchTerm.toLowerCase())
                                                                            )
                                                                            .map((dep, i) => (
                                                                                <SelectItem key={i} value={dep} className="py-3 font-medium">
                                                                                    {dep}
                                                                                </SelectItem>
                                                                            ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage className="text-red-500 font-medium" />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Group Head */}
                                                    <FormField
                                                        control={form.control}
                                                        name={`products.${index}.groupHead`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold text-gray-700">
                                                                    Group Head *
                                                                </FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl focus:border-green-500 transition-colors">
                                                                            <SelectValue placeholder="Select group head" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className="border-2 border-gray-200 rounded-xl shadow-lg">
                                                                        <div className="flex items-center border-b-2 border-gray-200 px-3 pb-3">
                                                                            <Search className="mr-2 h-4 w-4 text-gray-500" />
                                                                            <input
                                                                                placeholder="Search group heads..."
                                                                                value={searchTermGroupHead}
                                                                                onChange={(e) => setSearchTermGroupHead(e.target.value)}
                                                                                onKeyDown={(e) => e.stopPropagation()}
                                                                                className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 font-medium"
                                                                            />
                                                                        </div>
                                                                        {Object.keys(options?.groupHeads || {})
                                                                            .filter((dep) =>
                                                                                dep.toLowerCase().includes(searchTermGroupHead.toLowerCase())
                                                                            )
                                                                            .map((dep, i) => (
                                                                                <SelectItem key={i} value={dep} className="py-3 font-medium">
                                                                                    {dep}
                                                                                </SelectItem>
                                                                            ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage className="text-red-500 font-medium" />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Area of Use */}
                                                    <FormField
                                                        control={form.control}
                                                        name={`products.${index}.areaOfUse`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold text-gray-700">
                                                                    Area Of Use *
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Enter area of use"
                                                                        {...field}
                                                                        className="h-12 border-2 border-gray-300 rounded-xl focus:border-green-500 transition-colors"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage className="text-red-500 font-medium" />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Product Name */}
                                                    <FormField
                                                        control={form.control}
                                                        name={`products.${index}.productName`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold text-gray-700">
                                                                    Product Name *
                                                                </FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value} disabled={!groupHead}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl focus:border-green-500 transition-colors">
                                                                            <SelectValue placeholder="Select product" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className="border-2 border-gray-200 rounded-xl shadow-lg">
                                                                        <div className="flex items-center border-b-2 border-gray-200 px-3 pb-3">
                                                                            <Search className="mr-2 h-4 w-4 text-gray-500" />
                                                                            <input
                                                                                placeholder="Search products..."
                                                                                value={searchTermProductName}
                                                                                onChange={(e) => setSearchTermProductName(e.target.value)}
                                                                                onKeyDown={(e) => e.stopPropagation()}
                                                                                className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 font-medium"
                                                                            />
                                                                        </div>
                                                                        {productOptions
                                                                            .filter((dep) =>
                                                                                dep.toLowerCase().includes(searchTermProductName.toLowerCase())
                                                                            )
                                                                            .map((dep, i) => (
                                                                                <SelectItem key={i} value={dep} className="py-3 font-medium">
                                                                                    {dep}
                                                                                </SelectItem>
                                                                            ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage className="text-red-500 font-medium" />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Quantity */}
                                                    <FormField
                                                        control={form.control}
                                                        name={`products.${index}.quantity`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold text-gray-700">
                                                                    Quantity *
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        {...field}
                                                                        disabled={!groupHead}
                                                                        className="h-12 border-2 border-gray-300 rounded-xl focus:border-green-500 transition-colors"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage className="text-red-500 font-medium" />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* UOM */}
                                                    <FormField
                                                        control={form.control}
                                                        name={`products.${index}.uom`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold text-gray-700">
                                                                    UOM *
                                                                </FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value} disabled={!groupHead}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl focus:border-green-500 transition-colors">
                                                                            <SelectValue placeholder="Select UOM" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className="border-2 border-gray-200 rounded-xl shadow-lg">
                                                                        <div className="flex items-center border-b-2 border-gray-200 px-3 pb-3">
                                                                            <Search className="mr-2 h-4 w-4 text-gray-500" />
                                                                            <input
                                                                                placeholder="Search UOM..."
                                                                                value={searchTermUOM}
                                                                                onChange={(e) => setSearchTermUOM(e.target.value)}
                                                                                onKeyDown={(e) => e.stopPropagation()}
                                                                                className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 font-medium"
                                                                            />
                                                                        </div>
                                                                        {(options?.uoms || [])
                                                                            .filter((uom) =>
                                                                                uom.toLowerCase().includes(searchTermUOM.toLowerCase())
                                                                            )
                                                                            .map((uom, i) => (
                                                                                <SelectItem key={i} value={uom} className="py-3 font-medium">
                                                                                    {uom}
                                                                                </SelectItem>
                                                                            ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage className="text-red-500 font-medium" />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Number of Days */}
                                                    <FormField
                                                        control={form.control}
                                                        name={`products.${index}.numberOfDays`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold text-gray-700">
                                                                    Number of Days *
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        {...field}
                                                                        disabled={!groupHead}
                                                                        className="h-12 border-2 border-gray-300 rounded-xl focus:border-green-500 transition-colors"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage className="text-red-500 font-medium" />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Firm Name */}
                                                    <FormField
                                                        control={form.control}
                                                        name={`products.${index}.firmName`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="font-semibold text-gray-700">
                                                                    Firm Name *
                                                                </FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value} disabled={!groupHead}>
                                                                    <FormControl>
                                                                        <SelectTrigger className="h-12 border-2 border-gray-300 rounded-xl focus:border-green-500 transition-colors">
                                                                            <SelectValue placeholder="Select Firm Name" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent className="border-2 border-gray-200 rounded-xl shadow-lg">
                                                                        <div className="flex items-center border-b-2 border-gray-200 px-3 pb-3">
                                                                            <Search className="mr-2 h-4 w-4 text-gray-500" />
                                                                            <input
                                                                                placeholder="Search Firm Name..."
                                                                                value={searchTermFirmName}
                                                                                onChange={(e) => setSearchTermFirmName(e.target.value)}
                                                                                onKeyDown={(e) => e.stopPropagation()}
                                                                                className="flex h-10 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 font-medium"
                                                                            />
                                                                        </div>
                                                                        {(options?.firms || [])
                                                                            .filter((firm) =>
                                                                                firm.toLowerCase().includes(searchTermFirmName.toLowerCase())
                                                                            )
                                                                            .map((firm, i) => (
                                                                                <SelectItem key={i} value={firm} className="py-3 font-medium">
                                                                                    {firm}
                                                                                </SelectItem>
                                                                            ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage className="text-red-500 font-medium" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                {/* Attachment */}
                                                <FormField
                                                    control={form.control}
                                                    name={`products.${index}.attachment`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold text-gray-700">Attachment</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="file"
                                                                    onChange={(e) => field.onChange(e.target.files?.[0])}
                                                                    className="border-2 border-gray-300 rounded-xl focus:border-green-500 transition-colors py-3"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                {/* Specifications */}
                                                <FormField
                                                    control={form.control}
                                                    name={`products.${index}.specifications`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold text-gray-700">Specifications</FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="Enter specifications"
                                                                    {...field}
                                                                    className="min-h-24 border-2 border-gray-300 rounded-xl focus:border-green-500 transition-colors resize-y text-lg"
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

                            {/* Submit Button */}
                            <div className="pt-6 border-t-2 border-gray-200">
                                <Button
                                    className="w-full h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300"
                                    type="submit"
                                    disabled={form.formState.isSubmitting}
                                >
                                    {form.formState.isSubmitting ? (
                                        <>
                                            <Loader size={24} color="white" className="mr-3" />
                                            Creating Indent...
                                        </>
                                    ) : (
                                        'Create Indent'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
};