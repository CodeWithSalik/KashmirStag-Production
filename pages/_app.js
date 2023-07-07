import { useState } from 'react'
import Footer from '@/component/Footer'
import Navbar from '@/component/Navbar'
import '@/styles/globals.css'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import LoadingBar from 'react-top-loading-bar'


export default function App({ Component, pageProps }) {
  const [progress, setProgress] = useState(0)
  const [cart, setCart] = useState({})
  const [subTotal, setSubTotal] = useState(0)
  const [user, setUser] = useState({value: null})
  const [key, setKey] = useState()
  const router = useRouter()
  
  useEffect(() => {
    router.events.on('routeChangeStart', ()=>{
      setProgress(40)
    })
    router.events.on('routeChangeComplete', ()=>{
      setProgress(100)
    })
    try {
      const storedCart = localStorage.getItem("cart")
      if (storedCart) {
        setCart(JSON.parse(storedCart))
        calculateSubTotal(JSON.parse(storedCart))
      }
    } catch (error) {
      console.error(error)
      localStorage.removeItem("cart")
    }
    const token = localStorage.getItem('token')
    if(token){
      setUser({value:token})
      setKey(Math.random())
    }
  }, [router.query])

  const logout = ()=>{
    localStorage.removeItem("token")
    setUser({value: null})
    setKey(Math.random())
    router.push('/')
  }

  const calculateSubTotal = (myCart) => {
    let subt = 0
    let keys = Object.keys(myCart)
    for (let i = 0; i < keys.length; i++) {
      subt += myCart[keys[i]].price * myCart[keys[i]].qty
    }
    setSubTotal(subt)
  }
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
  const buyNow = (itemCode, qty, price, name, variant, size)=>{
    let newCart = {itemCode: { qty, price,name, variant, size }};
    setCart(newCart);
    saveCart(newCart)
    router.push('/checkout')
}
  
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
    localStorage.setItem("cart", JSON.stringify(myCart))
    calculateSubTotal(myCart)
  }

  const clearCart = () => {
    setCart({})
    localStorage.removeItem("cart")
  }

  return (
    <>
      <LoadingBar
        color='#8B8000'
        progress={progress}
        onLoaderFinished={() => setProgress(0)}
      />
      {key && <Navbar Logout={logout} user={user} key={key} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} clearCart={clearCart} subTotal={subTotal} />}
      <Component buyNow={buyNow} cart={cart} addToCart={addToCart} removeFromCart={removeFromCart} clearCart={clearCart} subTotal={subTotal} {...pageProps} />
      <Footer />
    </>
  )
}