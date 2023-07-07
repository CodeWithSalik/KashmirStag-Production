import React, { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TfiShoppingCart, TfiClose, TfiPlus, TfiMinus, TfiBag } from 'react-icons/tfi'
import { VscAccount } from 'react-icons/vsc'
import { useState } from 'react'

const Navbar = ({ Logout, user, cart, addToCart, removeFromCart, clearCart, subTotal, }) => {
  // console.log(cart, addToCart, removeFromCart, clearCart, subtotal)
  const toggleCart = () => {
    if (ref.current.classList.contains('translate-x-full')) {
      ref.current.classList.remove('translate-x-full')
      ref.current.classList.add('translate-x-0')
    }
    else if (!ref.current.classList.contains('translate-x-full')) {
      ref.current.classList.remove('translate-x-0')
      ref.current.classList.add('translate-x-full')
    }
  }
  const [dropdown, setDropdown] = useState(false)
  const ref = useRef()
  return (
    <div className='flex flex-col md:flex-row md:justify-start justify-center items-center py-2 shadow-md sticky top-0 bg-white z-10'>
      <div className="logo mr-auto md:mx-5">
        <Link href={"/"}> <Image src="/logo.png" alt="" width={220} height={100} /></Link>
      </div>
      <div className="nav">
        <ul className='flex  items-center space-x-4 font-bold md:text-md'>
          <Link href={"/tshirts"}><li className=' hover:text-yellow-400'>Tshirts</li></Link>
          <Link href={"/hoodies"}><li className=' hover:text-yellow-400'>Hoodies</li></Link>
          <Link href={"/shoes"}><li className=' hover:text-yellow-400'>Shoes</li></Link>
          <Link href={"/about"}><li className=' hover:text-yellow-400'>About</li></Link>
          <Link href={"/contact"}><li className=' hover:text-yellow-400'>Contact</li></Link>
        </ul>
      </div>
      <div className="icons flex items-center ml-auto mr-4">
      </div>
      <span onMouseOver={() => { setDropdown(true) }} onMouseLeave={() => { setDropdown(false) }}>
        {dropdown && <div onMouseOver={() => { setDropdown(true) }} onMouseLeave={() => { setDropdown(false) }} className="absolute right-8 bg-white shadow-lg font-semibold border top-6 py-4 rounded-md px-5 w-32 ">
          <ul>
            <Link href={'/myaccount'}><li className='py-1 textsm hover:text-yellow-400'>Account</li></Link>
            <Link href={'/orders'}><li className='py-1 textsm hover:text-yellow-400'>Orders</li></Link>
            <li onClick={Logout} className='py-1 textsm hover:text-yellow-400'>Logout</li>
          </ul>
        </div>}


        {user.value && <VscAccount className='text-xl  md:text-2xl mx-4' />}
      </span>
      {!user.value && <Link href={'/login'}>
        <button className='px-2 py-1 rounded-md bg-yellow-600 text-white'>Login</button>
      </Link>}
      <TfiShoppingCart onClick={toggleCart} className='text-xl  md:text-2xl' />

      <div ref={ref} className={`sideCart h-[100vh] w-72 overflow-y-scroll absolute top-0 right-0 bg bg-yellow-100 py-10 px-8 transform transition-transform ${Object.keys(cart).length !== 0 ? 'translate-x-0' : 'translate-x-full'} translate-x-0`}>
        <h2 className='font-bold text-xl text-center'>Shopping Cart</h2>
        <span onClick={toggleCart} className="absolute top-2 right-2 cursor-pointer text-2xl text-yellow-500"><TfiClose /></span>
        <ol className='list-decimal font-semibold'>
          {Object.keys(cart).length == 0 && <div className='my-4 font-semibold'>No items present in cart ! Please add items to checkout </div>}
          {Object.keys(cart).map((k) => {
            return <li key={k}>
              <div className="item flex my-5">
                <div className='w-2/3 font-semibold'>{cart[k].name}({cart[k].size}/{cart[k].variant})</div>
                <div className='w-1/3 flex items-center justify-center font-semibold space-x-3'>
                  <TfiMinus onClick={() => { console.log(cart[k]); removeFromCart(k, 1, cart[k].price, cart[k].name, cart[k].size, cart[k].variant) }} className='mx-3 cursor-pointer text-yellow-500 font-bold' /> {cart[k].qty} <TfiPlus onClick={() => { addToCart(k, 1, cart[k].price, cart[k].name, cart[k].size, cart[k].variant) }} className='mx-3 cursor-pointer text-yellow-500 font-bold' />
                </div>
              </div>
            </li>
          })}
        </ol>
        <div className="font-bold my-2">Subtotal: {subTotal}</div>
        <div className="flex">
          <Link href={'/checkout'}> <button className="flex  mr-2 text-white bg-yellow-500 border-0 py-2 px-2 focus:outline-none hover:bg-yellow-600 rounded text-sm"> <TfiBag className=' m-1' />Checkout</button> </Link>
          <button onClick={clearCart} className="flex  mr-2 text-white bg-yellow-500 border-0 py-2 px-2 focus:outline-none hover:bg-yellow-600 rounded text-sm">Clear cart</button>
        </div>


      </div>

    </div>
  )
}

export default Navbar
