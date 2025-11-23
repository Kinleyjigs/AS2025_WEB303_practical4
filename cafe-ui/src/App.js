import React, { useState } from "react";
import "./App.css";

function App() {
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");

  const menuItems = [
    { id: "1", name: "Coffee", price: 2.50 },
    { id: "2", name: "Sandwich", price: 5.00 },
    { id: "3", name: "Muffin", price: 3.25 }
  ];

  const addToCart = (item) => {
    setCart([...cart, item]);
    setMessage("");
  };

  const placeOrder = () => {
    if (cart.length === 0) {
      setMessage("Your cart is empty!");
      return;
    }

    const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setMessage(`✅ Order ${orderId} placed successfully!`);
    setCart([]);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Student Cafe</h1>
        <p>Microservices Demo - Static Version</p>
      </header>
      <main className="container">
        <div className="menu">
          <h2>Menu</h2>
          <ul>
            {menuItems.map((item) => (
              <li key={item.id}>
                <span>
                  {item.name} - ${item.price.toFixed(2)}
                </span>
                <button onClick={() => addToCart(item)}>Add to Cart</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="cart">
          <h2>Your Cart</h2>
          {cart.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <>
              <ul>
                {cart.map((item, index) => (
                  <li key={index}>
                    {item.name} - ${item.price.toFixed(2)}
                    <button onClick={() => removeFromCart(index)} className="remove-btn">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <p className="total">Total: ${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</p>
              <button onClick={placeOrder} className="order-btn">
                Place Order
              </button>
            </>
          )}
          {message && (
            <p className={message.includes("✅") ? "message success" : "message error"}>
              {message}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;