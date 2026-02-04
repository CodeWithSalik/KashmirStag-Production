import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Footer from '@/component/Footer';
import Navbar from '@/component/Navbar';
import LoadingBar from 'react-top-loading-bar';
import { calculateSubTotal } from './cartUtils';
import { CartContextProvider } from './CartContext';

export default function App({ Component, pageProps }) {
  const [progress, setProgress] = useState(0);
  const [cart, setCart] = useState({});
  const [subTotal, setSubTotal] = useState(0);
  const [user, setUser] = useState({ value: null });
  const [key, setKey] = useState();
  const router = useRouter();

  useEffect(() => {
    router.events.on('routeChangeStart', () => {
      setProgress(40);
    });
    router.events.on('routeChangeComplete', () => {
      setProgress(100);
    });
    const clearCart = () => {
      setCart({});
      localStorage.removeItem("cart");
    };

    try {
      const storedCart = localStorage.getItem("cart");
      if (storedCart) {
        setCart(JSON.parse(storedCart));
        const calculatedSubTotal = calculateSubTotal(JSON.parse(storedCart));
        setSubTotal(calculatedSubTotal);
      }
      
    } catch (error) {
      console.log(cart,"I am console form _app.js in useeffect")
      console.error(error);
      localStorage.removeItem("cart");
    }

    const token = localStorage.getItem('token');
    if (token) {
      setUser({ value: token });
      setKey(Math.random());
    }
  }, [router.query]);

  const logout = () => {
    localStorage.removeItem("token");
    setUser({ value: null });
    setKey(Math.random());
    router.push('/');
  };

  const addToCart = (itemCode, qty, price, name, variant, size) => {
    let newCart = { ...cart };
    if (itemCode in newCart) {
      newCart[itemCode].qty += qty;
    } else {
      newCart[itemCode] = { qty, price, name, variant, size };
    }
    setCart(newCart);
    saveCart(newCart);
  };

  const buyNow = (itemCode, qty, price, name, variant, size) => {
    let newCart = { ...cart };
    newCart[itemCode] = { qty, price, name, variant, size };
    setCart(newCart);
    saveCart(newCart);
    router.push('/checkout');
  };

  const removeFromCart = (itemCode, qty, price, name, variant, size) => {
    let newCart = { ...cart };
    if (itemCode in newCart) {
      newCart[itemCode].qty -= qty;
      if (newCart[itemCode].qty <= 0) {
        delete newCart[itemCode];
      }
    }
    setCart(newCart);
    saveCart(newCart);
  };

  const saveCart = (myCart) => {
    localStorage.setItem("cart", JSON.stringify(myCart));
    const calculatedSubTotal = calculateSubTotal(myCart);
    setSubTotal(calculatedSubTotal);
  };

  const clearCart = () => {
    setCart({});
    localStorage.removeItem("cart");
  }

  return (
    <>
      <LoadingBar
        color='#8B8000'
        progress={progress}
        onLoaderFinished={() => setProgress(0)}
      />
      <Navbar Logout={logout} user={user} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} clearCart={clearCart} subTotal={subTotal} />
      <CartContextProvider cart={cart} addToCart={addToCart} removeFromCart={removeFromCart}>

      <Component calculateSubTotal={calculateSubTotal} buyNow={buyNow} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} clearCart={clearCart} subTotal={subTotal} {...pageProps} />
      </CartContextProvider>

      <Footer />
    </>
  );
}
