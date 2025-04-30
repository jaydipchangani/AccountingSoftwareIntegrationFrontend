import React, { useState } from 'react';
import { Drawer, Button, Form, DatePicker, notification } from 'antd';
import { Customer } from './Customer';  // Assuming Customer type is exported from CustomerDropDown
import dayjs from 'dayjs';
import CustomerDropDown from './CustomerDropDown';

// Drawer component for adding invoice
const InvoiceDrawer = ({ visible, onClose, customers, onAddInvoice }: { 
  visible: boolean; 
  onClose: () => void; 
  customers: Customer[]; 
  onAddInvoice: (invoiceData: any) => void; 
}) => {
  const [form] = Form.useForm();
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (values: any) => {
    const invoiceData = {
      ...values,
      customerId: selectedCustomer,
      invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),  // Format the date properly
      dueDate: values.dueDate.format('YYYY-MM-DD')  // Ensure you have the due date formatted
    };

    try {
      const response = await fetch('https://localhost:7241/api/InvoiceContoller/add-to-quickbooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData), // Send the invoice data to backend
      });

      if (response.ok) {
        const result = await response.json();
        notification.success({
          message: 'Invoice Created',
          description: `Invoice #${result.invoiceNumber} created successfully in QuickBooks.`,
        });
        onAddInvoice(result);  // Update the parent component with the new invoice
        form.resetFields();
        onClose();  // Close the drawer
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create invoice');
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: error.message || 'An error occurred while creating the invoice.',
      });
    }
  };

  return (
    <Drawer
      title="Add New Invoice"
      width={720}
      onClose={onClose}
      visible={visible}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} type="primary" form="invoiceForm" htmlType="submit">
            Submit
          </Button>
        </div>
      }
    >
      {/* Pass selectedCustomer and setSelectedCustomer as props to CustomerDropDown */}
      <CustomerDropDown selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} />
    </Drawer>
  );
};

export default InvoiceDrawer;
