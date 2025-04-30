import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Callback from './Callback';
import Home from './Home';
import ChartOfAccounts from './ChartOfAccounts';
import Customer from './Customer';
import Products from './ProductPage';
import InvoiceTable from './InvoiceTable';
import AddInvoiceForm from './AddInvoiceForm';
import EditInvoicePage from './EditInvoicePage';
import VendorDashboard from './VendorDashboard';
import AddBillPage from './AddBillPage';
import BillsTable from './BillsTable';
import CsvUpload from './CSVUploadPage';
import XeroLoginButton from './components/XeroLoginButton';
import XeroLoginPage from './XeroLoginPage';

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/home" element={<Home />}>
          <Route path="chart-of-accounts" element={<ChartOfAccounts />} />
          <Route path="customer" element={<Customer />} />
          <Route path="products" element={<Products />} />
          <Route path="invoice" element={<InvoiceTable />} />
          
          <Route path="add-invoice" element={<AddInvoiceForm/>} />

          <Route path="edit-invoice/:quickBooksId" element={<EditInvoicePage />} />

          <Route path="vendor" element={<VendorDashboard />} />
          <Route path="add-bill" element={<AddBillPage />} />

          <Route path="bills" element={<BillsTable />} />

          <Route path="csv" element={<CsvUpload />} />
          <Route path="loginXero" element={<XeroLoginPage />} />

          <Route path="*" element={<h1>404 Not Found</h1>} />
          
        </Route>     
      </Routes>
    </BrowserRouter>
);
