import { useState } from 'react';

const AdminPanel = () => {
  const [products, setProducts] = useState([{ title: '', slug: '', desc: '', img: '', category: '', size: '', color: '', price: '', availableQty: '' }]);

  const handleInputChange = (index, event) => {
    const values = [...products];
    values[index][event.target.name] = event.target.value;
    setProducts(values);
  };

  const handleAddProduct = () => {
    setProducts([...products, { title: '', slug: '', desc: '', img: '', category: '', size: '', color: '', price: '', availableQty: '' }]);
  };

  const handleRemoveProduct = (index) => {
    const values = [...products];
    values.splice(index, 1);
    setProducts(values);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_LHOST}/api/addproducts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(products),
    });

    const result = await res.json();
    console.log(result);
  };

  return (
    <form onSubmit={handleSubmit}>
      {products.map((product, index) => (
        <div key={index}>
          <input name="title" value={product.title} onChange={(e) => handleInputChange(index, e)} placeholder="Title" />
          <input name="slug" value={product.slug} onChange={(e) => handleInputChange(index, e)} placeholder="Slug" />
          <input name="desc" value={product.desc} onChange={(e) => handleInputChange(index, e)} placeholder="Description" />
          <input name="img" value={product.img} onChange={(e) => handleInputChange(index, e)} placeholder="Image URL" />
          <input name="category" value={product.category} onChange={(e) => handleInputChange(index, e)} placeholder="Category" />
          <input name="size" value={product.size} onChange={(e) => handleInputChange(index, e)} placeholder="Size" />
          <input name="color" value={product.color} onChange={(e) => handleInputChange(index, e)} placeholder="Color" />
          <input name="price" value={product.price} onChange={(e) => handleInputChange(index, e)} placeholder="Price" />
          <input name="availableQty" value={product.availableQty} onChange={(e) => handleInputChange(index, e)} placeholder="Available Quantity" />
          <button type="button" onClick={() => handleRemoveProduct(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={handleAddProduct}>Add Another Product</button>
      <button type="submit">Submit</button>
    </form>
  );
};

export default AdminPanel;
