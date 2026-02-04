export function calculateSubTotal(myCart) {
    if (!myCart) {
      return 0; // or some default value
    }
  
    let subt = 0;
    let keys = Object.keys(myCart);
    for (let i = 0; i < keys.length; i++) {
      subt += myCart[keys[i]].price * myCart[keys[i]].qty;
    }
    return subt;
  }