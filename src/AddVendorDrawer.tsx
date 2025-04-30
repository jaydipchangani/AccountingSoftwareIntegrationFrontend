import React from "react";
import { Drawer, Form, Input, Button, message, Modal } from "antd";
import axios from "axios";

type AddVendorDrawerProps = {
  visible: boolean;
  onClose: () => void;
  onVendorAdded: () => void;
};

const AddVendorDrawer: React.FC<AddVendorDrawerProps> = ({ visible, onClose, onVendorAdded }) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    try {
      await axios.post("https://localhost:7241/api/Vendor/addVendor", values);
      Modal.success({
        title: "Success",
        content: "Vendor added successfully!",
      });
      onClose();
      onVendorAdded();
    } catch (err) {
      console.error(err);
      Modal.error({
        title: "Error",
        content: "Failed to add vendor. Please try again.",
      });
    }
  };

  return (
    <Drawer
      title="Add New Vendor"
      width={400}
      onClose={onClose}
      open={visible}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Display Name"
          name="displayName"
          rules={[{ required: true, message: "Display Name is required" }]}
        >
          <Input placeholder="Acme Supplies Inc." />
        </Form.Item>

        <Form.Item label="Email" name="primaryEmailAddr">
          <Input type="email" placeholder="vendor@example.com" />
        </Form.Item>

        <Form.Item label="Phone Number" name="primaryPhone">
          <Input placeholder="(123) 456-7890" />
        </Form.Item>

        <Form.Item label="Website" name="webAddr">
          <Input placeholder="https://vendor.com" />
        </Form.Item>

        <Form.Item label="Address Line 1" name="billAddrLine1">
          <Input placeholder="123 Main St" />
        </Form.Item>

        <Form.Item label="City" name="billAddrCity">
          <Input placeholder="New York" />
        </Form.Item>

        <Form.Item label="Postal Code" name="billAddrPostalCode">
          <Input placeholder="10001" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Add Vendor
          </Button>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default AddVendorDrawer;
