
const express = require("express");
const cors = require("cors");
const fs = require("node:fs/promises");
const path = require("node:path");

const app = express();
const PORT = process.env.PORT || 5000;

const DATA_FILE = path.join(__dirname, "data", "products.json");

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://adobe-commerce-hub.vercel.app"
  ]
}));

app.use(express.json());

async function readProducts() {
  const data = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(data);
}

async function writeProducts(products) {
  await fs.writeFile(
    DATA_FILE,
    JSON.stringify(products, null, 2),
    "utf8"
  );
}

function getStatus(stock) {
  if (stock === 0) return "Out of stock";
  if (stock <= 10) return "Low stock";
  return "Active";
}

function validateProduct(body) {
  const name =
    typeof body.name === "string" ? body.name.trim() : "";

  const category =
    typeof body.category === "string" ? body.category.trim() : "";

  const price = body.price;
  const stock = body.stock;

  if (!name || !category) {
    return "Product name and category are required.";
  }

  if (
    price === "" ||
    price === null ||
    price === undefined ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0
  ) {
    return "Price must be a valid non-negative number.";
  }

  if (
    stock === "" ||
    stock === null ||
    stock === undefined ||
    !Number.isInteger(Number(stock)) ||
    Number(stock) < 0
  ) {
    return "Stock must be a non-negative whole number.";
  }

  return null;
}

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Adobe Commerce Hub API is running." });
});

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (error) {
    console.error("Failed to read products:", error);
    res.status(500).json({ message: "Could not load products." });
  }
});

// Create a product
app.post("/api/products", async (req, res) => {
  try {
    const validationError = validateProduct(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const products = await readProducts();

    const highestId = products.reduce((max, product) => {
      const number = Number(String(product.id).replace("PRD-", ""));
      return Number.isFinite(number) ? Math.max(max, number) : max;
    }, 1000);

    const price = Number(req.body.price);
    const stock = Number(req.body.stock);

    const newProduct = {
      id: `PRD-${highestId + 1}`,
      name: req.body.name.trim(),
      category: req.body.category.trim(),
      price,
      stock,
      status: getStatus(stock),
      icon: "◇",
      color: "blue",
    };

    products.unshift(newProduct);
    await writeProducts(products);

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Failed to create product:", error);
    res.status(500).json({ message: "Could not create product." });
  }
});

// Update a product
app.put("/api/products/:id", async (req, res) => {
  try {
    const validationError = validateProduct(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const products = await readProducts();
    const index = products.findIndex(
      (product) => product.id === req.params.id
    );

    if (index === -1) {
      return res.status(404).json({ message: "Product not found." });
    }

    const existingProduct = products[index];
    const price = Number(req.body.price);
    const stock = Number(req.body.stock);

    const updatedProduct = {
      ...existingProduct,
      name: req.body.name.trim(),
      category: req.body.category.trim(),
      price,
      stock,
      status: getStatus(stock),
    };

    products[index] = updatedProduct;
    await writeProducts(products);

    res.json(updatedProduct);
  } catch (error) {
    console.error("Failed to update product:", error);
    res.status(500).json({ message: "Could not update product." });
  }
});

// Delete a product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const products = await readProducts();
    const updatedProducts = products.filter(
      (product) => product.id !== req.params.id
    );

    if (updatedProducts.length === products.length) {
      return res.status(404).json({ message: "Product not found." });
    }

    await writeProducts(updatedProducts);

    res.json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Failed to delete product:", error);
    res.status(500).json({ message: "Could not delete product." });
  }
});

app.listen(PORT, () => {
  console.log(`Adobe Commerce Hub API running at http://localhost:${PORT}`);
});

app.listen(PORT, () => {
  console.log(
    `Adobe Commerce Hub API running at http://localhost:${PORT}`
  );
});