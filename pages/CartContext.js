import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartContextProvider({ children, cart, addToCart, removeFromCart }) {
  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
