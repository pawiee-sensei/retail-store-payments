import { useCart } from '../hooks/useCart';

function CartSidebar({ onCheckout }) {
  const { cart, increment, decrement, subtotal } = useCart();

  return (
    <aside className="cart-sidebar">
      <h2>Your Cart</h2>

      {cart.length === 0 ? (
        <p className="cart-empty">Your cart is empty</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map(item => (
              <div className="cart-item" key={item.product_id}>
                <div className="cart-item-info">
                  <span className="cart-item-name">{item.name}</span>
                  <span className="cart-item-price">₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div className="cart-item-qty">
                  <button onClick={() => decrement(item.product_id)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => increment(item.product_id)}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-subtotal">
            <span>Subtotal</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>

          <button className="checkout-btn" onClick={onCheckout}>
            Checkout
          </button>
        </>
      )}
    </aside>
  );
}

export default CartSidebar;