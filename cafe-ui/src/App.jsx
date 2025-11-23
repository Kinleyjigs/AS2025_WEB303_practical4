import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");

  // API base - use Vite env var if provided, otherwise assume Kong on localhost:8000
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

  const FALLBACK_ITEMS = [
    { id: "1", name: "Coffee", price: 2.5 },
    { id: "2", name: "Sandwich", price: 5.0 },
    { id: "3", name: "Muffin", price: 3.25 },
  ];

  useEffect(() => {
    // Fetch from the API Gateway's route via Kong (or direct API_BASE)
    fetch(`${API_BASE}/api/catalog/items`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setItems(data))
      .catch((err) => {
        console.error("Error fetching items:", err);
        // Use fallback static menu so UI remains usable
        setItems(FALLBACK_ITEMS);
      });
  }, []);

  const addToCart = (item) => {
    setCart((prevCart) => [...prevCart, item]);
  };

  const placeOrder = () => {
    if (cart.length === 0) {
      setMessage("Your cart is empty!");
      return;
    }

    const order = {
      item_ids: cart.map((item) => item.id),
    };

    fetch(`${API_BASE}/api/orders/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Order failed');
        }
        return res.json();
      })
      .then((data) => {
        setMessage(`Order ${data.id} placed successfully!`);
        setCart([]); // Clear cart
      })
      .catch((err) => {
        setMessage("Failed to place order. Please try again.");
        console.error("Error placing order:", err);
      });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Student Cafe</h1>
      </header>
      <main className="container">
        <div className="menu">
          <h2>Menu</h2>
          <ul>
            {items.map((item) => (
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
          <ul>
            {cart.map((item, index) => (
              <li key={index}>{item.name} - ${item.price.toFixed(2)}</li>
            ))}
          </ul>
          <p>Total: ${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</p>
          <button onClick={placeOrder} className="order-btn">
            Place Order
          </button>
          {message && <p className="message">{message}</p>}
        </div>
      </main>
    </div>
  );
}

export default App;
