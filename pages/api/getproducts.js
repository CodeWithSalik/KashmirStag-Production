import Product from "@/models/Product";
import connectDb from "@/middleware/mongoose";

const handler = async (req, res) => {
  try {
    const products = await Product.find();

    const tshirts = {};
    products.forEach((item) => {
      if (item.availableQty > 0) {
        const { title, color, size } = item;

        if (title in tshirts) {
          tshirts[title].color.add(color);
          tshirts[title].size.add(size);
        } else {
          tshirts[title] = { color: new Set([color]), size: new Set([size]) };
        }
      }
    });

    // Convert Sets back to arrays
    Object.keys(tshirts).forEach((title) => {
      tshirts[title].color = Array.from(tshirts[title].color);
      tshirts[title].size = Array.from(tshirts[title].size);
    });

    res.status(200).json({ tshirts });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching the products" });
  }
};

export default connectDb(handler);
