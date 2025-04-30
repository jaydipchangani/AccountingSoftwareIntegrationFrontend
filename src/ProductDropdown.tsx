import React, { useEffect, useState } from 'react';
import { Select, Spin, Typography } from 'antd';

const { Option } = Select;

interface Product {
  id: number;
  name: string;
}

const ProductDropdown: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('https://localhost:7241/api/InvoiceContoller/products');
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleChange = (value: number) => {
    setSelectedProduct(value);
  };

  const selectedProductName = products.find(p => p.id === selectedProduct)?.name;

  return (
    <div style={{ maxWidth: 600 }}>
     
      {loading ? (
        <Spin />
      ) : (
        <Select
          style={{ width: '100%' }}
          placeholder="Choose a product"
          value={selectedProduct ?? undefined}
          onChange={handleChange}
          allowClear
        >
          {products.map(product => (
            <Option key={product.id} value={product.id}>
              {product.name}
            </Option>
          ))}
        </Select>
      )}

    </div>
  );
};

export default ProductDropdown;
