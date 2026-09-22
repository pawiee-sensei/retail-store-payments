import { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:5000/api';

function ProductList({ onAddToCart }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then(res => res.json())
      .then(data => setProducts(data.data));
  }, []);

  return (
    <section>
      <h2>Products</h2>
      {products.map(product => (
        <div className="product-item" key={product.id}>
          <span>{product.name} — ₱{product.price} (stock: {product.stock})</span>
          <button onClick={() => onAddToCart(product)}>Add</button>
        </div>
      ))}
    </section>
  );
}

export default ProductList;