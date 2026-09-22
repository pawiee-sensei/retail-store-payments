import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import ProductList from '../components/ProductList';
import CartSidebar from '../components/CartSidebar';

function ShopPage() {
  const { cart, addToCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="shop-layout">
      <div className="shop-main">
        <h1>Retail Store</h1>
        <ProductList onAddToCart={addToCart} />
      </div>
      <CartSidebar onCheckout={() => navigate('/checkout')} />
    </div>
  );
}

export default ShopPage;