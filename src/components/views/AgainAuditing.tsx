import { Package2 } from 'lucide-react';
import Heading from '../element/Heading';
import { useSheets } from '@/context/SheetsContext';
import { useEffect, useState } from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import type { TallyEntrySheet } from '@/types';
import { useAuth } from '@/context/AuthContext';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { toast } from 'sonner';
import { postToSheet } from '@/lib/fetchers';
import { PuffLoader as Loader } from 'react-spinners';
import { Badge } from '../ui/badge';

export default function PcReportTable() {
  const { tallyEntrySheet, updateAll } = useSheets();
  const [data, setData] = useState<TallyEntrySheet[]>([]);
  const [selectedRow, setSelectedRow] = useState<TallyEntrySheet | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const { user } = useAuth();

  // Update table data whenever tallyEntrySheet changes
  useEffect(() => {
    if (!tallyEntrySheet) return;

    // Pehle firm name se filter karo (case-insensitive)
    const filteredByFirm = tallyEntrySheet.filter(item =>
      user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
    );

    // Filter the data according to planned5 has value and actual5 is empty/null
    const filteredData = filteredByFirm.filter(
      (row) =>
        (row.planned5 !== null && row.planned5 !== undefined && row.planned5 !== '') &&
        (row.actual5 === null || row.actual5 === undefined || row.actual5 === '')
    );

    console.log("Filtered Tally Entry Sheet:", filteredData);
    setData(filteredData);
  }, [tallyEntrySheet, user.firmNameMatch]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!openDialog) {
      form.reset({ status: undefined });
    }
  }, [openDialog]);

  // Validation schema
  const schema = z.object({
    status: z.enum(['okey', 'not okey']),
  });

  // Form setup
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      status: undefined,
    },
  });

  // Handle form submission
  async function onSubmit(values: z.infer<typeof schema>) {
    if (!selectedRow) {
      toast.error('No row selected!');
      return;
    }

    try {
      // Prepare data to post
      const mappedData = [
        {
          rowIndex: selectedRow.rowIndex,      // Required for identifying the row in Sheet
          actual5: new Date().toISOString(),   // Update actual5 to current timestamp
          status5: values.status,              // Update status5 from form
        }
      ];

      console.log('Selected Row:', selectedRow);
      console.log('Mapped Data to post:', mappedData);

      // Post to Google Sheet
      await postToSheet(mappedData, 'update', 'TALLY ENTRY');

      toast.success(`Status updated for Indent ${selectedRow.indentNo}`);

      // Close dialog and refresh data
      setOpenDialog(false);
      setTimeout(() => updateAll(), 1000);

    } catch (err) {
      console.error('Error in onSubmit:', err);
      toast.error('Failed to update');
    }
  }

  function onError(e: any) {
    console.log(e);
    toast.error('Please fill all required fields');
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  // Columns for TallyEntrySheet - ALL ORIGINAL COLUMNS PRESERVED
  const columns: ColumnDef<TallyEntrySheet>[] = [
    {
      id: 'actions',
      header: 'Action',
      cell: ({ row }: { row: Row<TallyEntrySheet> }) => {
        const rowData = row.original;
        return (
          <div className="flex justify-center">
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRow(rowData);
                }}
                className="min-w-[100px]"
              >
                Process
              </Button>
            </DialogTrigger>
          </div>
        );
      },
    },
    {
      accessorKey: 'indentNo',
      header: 'Indent Number',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.indentNo}
        </div>
      )
    },
    {
      accessorKey: 'indentDate',
      header: 'Indent Date',
      cell: ({ row }) => (
        <div className="text-center">
          {formatDate(row.original.indentDate)}
        </div>
      )
    },
    {
      accessorKey: 'purchaseDate',
      header: 'Purchase Date',
      cell: ({ row }) => (
        <div className="text-center">
          {formatDate(row.original.purchaseDate)}
        </div>
      )
    },
    {
      accessorKey: 'materialInDate',
      header: 'Material In Date',
      cell: ({ row }) => (
        <div className="text-center">
          {formatDate(row.original.materialInDate)}
        </div>
      )
    },
    {
      accessorKey: 'productName',
      header: 'Product Name',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.productName}
        </div>
      )
    },
    {
      accessorKey: 'firmNameMatch',
      header: 'Firm Name',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.firmNameMatch}
        </div>
      )
    },
    {
      accessorKey: 'billNo',
      header: 'Bill No',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.billNo}
        </div>
      )
    },
    {
      accessorKey: 'qty',
      header: 'Quantity',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.qty}
        </div>
      )
    },
    {
      accessorKey: 'partyName',
      header: 'Party Name',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.partyName}
        </div>
      )
    },
    {
      accessorKey: 'billAmt',
      header: 'Bill Amount',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.billAmt}
        </div>
      )
    },
    {
      accessorKey: 'billImage',
      header: 'Bill Image',
      cell: ({ row }) => {
        const image = row.original.billImage;
        return (
          <div className="text-center">
            {image ? (
              <a href={image} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                View
              </a>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'billReceivedLater',
      header: 'Bill Received Later',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.billReceivedLater || '-'}
        </div>
      )
    },
    {
      accessorKey: 'notReceivedBillNo',
      header: 'Not Received Bill No',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.notReceivedBillNo || '-'}
        </div>
      )
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.location}
        </div>
      )
    },
    {
      accessorKey: 'typeOfBills',
      header: 'Type Of Bills',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.typeOfBills}
        </div>
      )
    },
    {
      accessorKey: 'productImage',
      header: 'Product Image',
      cell: ({ row }) => {
        const image = row.original.productImage;
        return (
          <div className="text-center">
            {image ? (
              <a href={image} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                View
              </a>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'area',
      header: 'Area',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.area}
        </div>
      )
    },
    {
      accessorKey: 'indentedFor',
      header: 'Indented For',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.indentedFor}
        </div>
      )
    },
    {
      accessorKey: 'approvedPartyName',
      header: 'Approved Party Name',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.approvedPartyName}
        </div>
      )
    },
    {
      accessorKey: 'rate',
      header: 'Rate',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.rate}
        </div>
      )
    },
    {
      accessorKey: 'indentQty',
      header: 'Indent Qty',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.indentQty}
        </div>
      )
    },
    {
      accessorKey: 'totalRate',
      header: 'Total Rate',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.totalRate}
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <div className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-xl shadow-sm border">
                    <Package2 size={32} className="text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      Again Auditing
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Perform final audit after tally entry
                    </p>
                  </div>
                </div>

                {/* Stats Card */}
                <div className="flex gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border min-w-[140px]">
                    <div className="text-sm font-medium text-gray-500">Pending Audit</div>
                    <div className="text-2xl font-bold text-amber-600 mt-1">
                      {data.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          Pending Audits
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Items requiring final audit after tally entry
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        Showing {data.length} entries
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <DataTable
                      data={data}
                      columns={columns}
                      searchFields={['indentNo', 'productName', 'partyName', 'billNo', 'firmNameMatch']}
                      dataLoading={false}
                      className="h-[70dvh]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dialog for Processing */}
        {selectedRow && (
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-6"
              >
                <DialogHeader className="text-center">
                  <DialogTitle className="text-2xl">Final Audit</DialogTitle>
                  <DialogDescription>
                    Perform final audit for indent number{' '}
                    <span className="font-bold text-primary">{selectedRow.indentNo}</span>
                  </DialogDescription>
                </DialogHeader>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-lg border">
                  <h3 className="text-lg font-bold mb-4 text-gray-800">Entry Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Indent Number', value: selectedRow.indentNo },
                      { label: 'Indent Date', value: formatDate(selectedRow.indentDate) },
                      { label: 'Purchase Date', value: formatDate(selectedRow.purchaseDate) },
                      { label: 'Material In Date', value: formatDate(selectedRow.materialInDate) },
                      { label: 'Product Name', value: selectedRow.productName },
                      { label: 'Firm Name', value: selectedRow.firmNameMatch },
                      { label: 'Bill No', value: selectedRow.billNo },
                      { label: 'Quantity', value: selectedRow.qty },
                      { label: 'Party Name', value: selectedRow.partyName },
                      { label: 'Bill Amount', value: selectedRow.billAmt },
                      { label: 'Bill Received Later', value: selectedRow.billReceivedLater || 'N/A' },
                      { label: 'Not Received Bill No', value: selectedRow.notReceivedBillNo || 'N/A' },
                      { label: 'Location', value: selectedRow.location },
                      { label: 'Type Of Bills', value: selectedRow.typeOfBills },
                      { label: 'Area', value: selectedRow.area },
                      { label: 'Indented For', value: selectedRow.indentedFor },
                      { label: 'Approved Party Name', value: selectedRow.approvedPartyName },
                      { label: 'Rate', value: selectedRow.rate },
                      { label: 'Indent Qty', value: selectedRow.indentQty },
                      { label: 'Total Rate', value: selectedRow.totalRate },
                    ].map((item, index) => (
                      <div key={index} className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">{item.label}</p>
                        <p className="text-base font-semibold text-gray-800 break-words">
                          {item.value || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Image Links */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-6">
                      {selectedRow.billImage && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Bill Image</p>
                          <a
                            href={selectedRow.billImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-semibold"
                          >
                            View Bill Image
                          </a>
                        </div>
                      )}
                      {selectedRow.productImage && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-500">Product Image</p>
                          <a
                            href={selectedRow.productImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-semibold"
                          >
                            View Product Image
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Audit Result *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select audit result" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="okey" className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>Okey</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="not okey" className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span>Not Okey</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-3">
                  <DialogClose asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Cancel
                    </Button>
                  </DialogClose>

                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                  >
                    {form.formState.isSubmitting && (
                      <Loader
                        size={20}
                        color="white"
                        className="mr-2"
                      />
                    )}
                    {form.formState.isSubmitting ? 'Processing...' : 'Submit Audit'}
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