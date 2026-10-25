import { useEffect, useMemo, useState } from "react";
import { Provider, defaultTheme, Button } from "@adobe/react-spectrum";
import { productService } from "./services/productService";
import "./App.css";


const initialProducts = [
  { id: "PRD-1001", name: "Wireless Headphones", category: "Electronics", price: 129.99, stock: 48, status: "Active", icon: "◉", color: "violet" },
  { id: "PRD-1002", name: "Minimal Desk Lamp", category: "Home & Living", price: 64.50, stock: 12, status: "Active", icon: "◈", color: "amber" },
  { id: "PRD-1003", name: "Everyday Backpack", category: "Accessories", price: 89.00, stock: 0, status: "Out of stock", icon: "▤", color: "blue" },
  { id: "PRD-1004", name: "Smart Watch Pro", category: "Electronics", price: 249.00, stock: 31, status: "Active", icon: "◷", color: "green" },
  { id: "PRD-1005", name: "Ceramic Coffee Set", category: "Home & Living", price: 42.00, stock: 5, status: "Low stock", icon: "◉", color: "rose" },
];


function Dashboard() {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [activePage, setActivePage] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
  });
  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await productService.getAll();
        setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
      }
    }

    loadProducts();
  }, []);
  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "",
      price: "",
      stock: "",
    });
    setActivePage("Products");
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name ?? "",
      category: product.category ?? "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
    });
    setActivePage("Products");
    setIsProductModalOpen(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  const saveProduct = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const price = Number(formData.price);
    const stock = Number(formData.stock);

    // Validate the form
    if (
      !name ||
      !formData.category ||
      formData.price.trim() === "" ||
      formData.stock.trim() === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      window.alert(
        "Please enter a product name, category, valid price, and whole-number stock quantity."
      );
      return;
    }

    const status =
      stock === 0
        ? "Out of stock"
        : stock <= 10
          ? "Low stock"
          : "Active";

    const productData = {
      name,
      category: formData.category,
      price,
      stock,
      status,
    };

    try {
      if (editingProduct) {
        // Update the existing product in the backend
        const updatedProduct = await productService.update(
          editingProduct.id,
          productData
        );

        setProducts((current) =>
          current.map((product) =>
            product.id === editingProduct.id
              ? {
                ...product,
                ...updatedProduct,
                price: Number(updatedProduct.price ?? price),
                stock: Number(updatedProduct.stock ?? stock),
                status: updatedProduct.status ?? status,
              }
              : product
          )
        );
      } else {
        // Create a new product in the backend
        const createdProduct = await productService.create(productData);

        setProducts((current) => [
          {
            ...createdProduct,
            price: Number(createdProduct.price ?? price),
            stock: Number(createdProduct.stock ?? stock),
            status: createdProduct.status ?? status,
            icon: "◇",
            color: "blue",
          },
          ...current,
        ]);
      }

      // Reset filters and close the modal after success
      setSearch("");
      setCategory("All categories");
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      window.alert(
        error.message || "Unable to save the product. Please try again."
      );
    }
  };




  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      await productService.remove(product.id);

      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );
    } catch (error) {
      console.error("Error deleting product:", error);
      window.alert(
        error.message || "Unable to delete the product. Please try again."
      );
    }
  };



  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        `${product.name} ${product.id} ${product.category}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        category === "All categories" || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const totalValue = products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0
  );

  const activeCount = products.filter(
    (product) => product.status === "Active"
  ).length;

  const lowStockCount = products.filter(
    (product) => product.stock > 0 && product.stock <= 10
  ).length;

  return (
    <Provider theme={defaultTheme} colorScheme="light">
      <div className="app-shell">
        <aside className={`sidebar ${isSidebarOpen ? "sidebar-open" : ""}`}>
          <div className="brand">
            <div className="brand-mark">A</div>
            <div>
              <div className="brand-name">Commerce Hub</div>
              <div className="brand-caption">MANAGEMENT PLATFORM</div>
            </div>
          </div>

          <div className="workspace-label">WORKSPACE</div>
          <div className="workspace-switcher">
            <span className="workspace-icon">C</span>
            <span className="workspace-copy">
              <strong>Commerce Store</strong>
              <small>Admin workspace</small>
            </span>
            <span className="chevron">⌄</span>
          </div>

          <div className="nav-label">OVERVIEW</div>
          <button
            className={`nav-item ${activePage === "Dashboard" ? "selected" : ""}`}
            onClick={() => setActivePage("Dashboard")}
          >
            <span className="nav-icon">▦</span> Dashboard
          </button>

          <div className="nav-label">MANAGEMENT</div>
          {[
            ["Products", "▤"],
            ["Categories", "◫"],
            ["Inventory", "▥"],
            ["Orders", "⇄"],
            ["Customers", "♙"],
          ].map(([label, icon]) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "selected" : ""}`}
              onClick={() => setActivePage(label)}
            >
              <span className="nav-icon">{icon}</span>
              {label}
              {label === "Products" && <span className="nav-count">{products.length}</span>}
            </button>
          ))}

          <div className="nav-label">SYSTEM</div>
          <button
            className={`nav-item ${activePage === "Settings" ? "selected" : ""}`}
            onClick={() => setActivePage("Settings")}
          >
            <span className="nav-icon">⚙</span> Settings
          </button>

          <div className="sidebar-bottom">
            <div className="help-card">
              <div className="help-icon">?</div>
              <strong>Need some help?</strong>
              <p>Explore the workspace and learn how everything works.</p>
              <button onClick={() => alert("Help center coming soon.")}>
                Visit help center ↗
              </button>
            </div>

            <div className="profile">
              <div className="avatar">SM</div>
              <div className="profile-copy">
                <strong>Store Administrator</strong>
                <small>Administrator</small>
              </div>
              <span className="chevron">···</span>
            </div>
          </div>
        </aside>

        <button
          className="mobile-menu-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isSidebarOpen}
        >
          ☰
        </button>
        <main className="main-area">
          <header className="topbar">
            <div className="breadcrumbs">
              Workspace <span>/</span>{" "}
              <strong>{activePage}</strong>
            </div>
            <div className="topbar-actions">
              <span className="environment"><i /> Development</span>
              <button className="icon-button" aria-label="Notifications">♧</button>
              <div className="top-avatar">SM</div>
            </div>
          </header>

          <div className="page-content">
            <div className="page-heading">
              <div>
                <div className="eyebrow">COMMERCE MANAGEMENT</div>
                <h1>{activePage === "Products" ? "Products" : activePage}</h1>
                <p className="page-description">
                  {activePage === "Products"
                    ? "Manage your catalog, monitor inventory, and keep your store organized."
                    : `Welcome to ${activePage.toLowerCase()}. This workspace is ready to expand.`}
                </p>
              </div>
              <div className="heading-actions">
                <Button variant="secondary" onPress={() => window.print()}>
                  Export report
                </Button>
                <Button variant="accent" onPress={handleAddProduct}>
                  <span className="plus">＋</span> Add product
                </Button>
              </div>
            </div>

            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-top">
                  <span>Total products</span>
                  <span className="stat-icon purple">▤</span>
                </div>
                <div className="stat-value">{products.length.toLocaleString()}</div>
                <div className="stat-foot">Products in your catalog</div>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span>Active products</span>
                  <span className="stat-icon mint">✓</span>
                </div>
                <div className="stat-value">{activeCount.toLocaleString()}</div>
                <div className="stat-foot"><span className="positive">●</span> Available for sale</div>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span>Low stock alerts</span>
                  <span className="stat-icon orange">!</span>
                </div>
                <div className="stat-value">{lowStockCount.toLocaleString()}</div>
                <div className="stat-foot">Products needing attention</div>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span>Inventory value</span>
                  <span className="stat-icon blue">$</span>
                </div>
                <div className="stat-value">
                  ${totalValue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="stat-foot">Based on current stock</div>
              </article>
            </section>
            {activePage === "Products" && (
              <section className="catalog-card">
                <div className="catalog-heading">
                  <div>
                    <h2>Product catalog</h2>
                    <p>View and manage all products in your store.</p>
                  </div>
                  <span className="record-count">
                    {filteredProducts.length} records
                  </span>
                </div>

                <div className="table-toolbar">
                  <div className="search-box">
                    <span>⌕</span>
                    <input
                      aria-label="Search products"
                      placeholder="Search products, SKU, category..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                    <kbd>⌘ K</kbd>
                  </div>

                  <select
                    aria-label="Filter by category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    <option>All categories</option>
                    <option>Electronics</option>
                    <option>Home & Living</option>
                    <option>Accessories</option>
                  </select>

                  <button
                    className="filter-button"
                    onClick={() => {
                      setSearch("");
                      setCategory("All categories");
                    }}
                  >
                    ↺ Reset
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="product-table">
                    <thead>
                      <tr>
                        <th><input type="checkbox" aria-label="Select all products" /></th>
                        <th>PRODUCT</th>
                        <th>SKU</th>
                        <th>CATEGORY</th>
                        <th>PRICE</th>
                        <th>STOCK</th>
                        <th>STATUS</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td><input type="checkbox" aria-label={`Select ${product.name}`} /></td>
                          <td>
                            <div className="product-cell">
                              <div className={`product-art ${product.color}`}>
                                {product.icon}
                              </div>
                              <strong>{product.name}</strong>
                            </div>
                          </td>
                          <td><span className="sku">{product.id}</span></td>
                          <td>{product.category}</td>
                          <td className="price">
                            ${product.price.toFixed(2)}
                          </td>
                          <td>
                            <span className={product.stock <= 10 ? "stock-warning" : ""}>
                              {product.stock}
                            </span>
                            <span className="stock-unit"> units</span>
                          </td>
                          <td>
                            <span className={`status ${product.status.toLowerCase().replaceAll(" ", "-")}`}>
                              <i />{product.status}
                            </span>
                          </td>

                          <td>
                            <div className="product-actions">
                              <button
                                type="button"
                                className="row-action-edit"
                                onClick={() => handleEditProduct(product)}
                                aria-label={`Edit ${product.name}`}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="row-action-delete"
                                onClick={() => handleDeleteProduct(product)}
                                aria-label={`Delete ${product.name}`}
                              >
                                Delete
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredProducts.length === 0 && (
                    <div className="empty-state">
                      <strong>No products found</strong>
                      <p>Try another search term or reset your filters.</p>
                    </div>
                  )}
                </div>

                <div className="table-footer">
                  <span>
                    Showing <strong>{filteredProducts.length}</strong> of{" "}
                    <strong>{products.length}</strong> products
                  </span>
                  <div className="pagination">
                    <button disabled>← Previous</button>
                    <button className="current-page">1</button>
                    <button disabled>Next →</button>
                  </div>
                </div>
              </section>
            )}
            <footer className="page-footer">
              <span>© 2026 Adobe Commerce Hub · Portfolio project</span>
              <span><i /> All changes are currently local</span>
            </footer>
          </div>

          {isProductModalOpen && (
            <div className="modal-overlay">
              <section
                className="product-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-modal-title"
              >
                <div className="modal-header">
                  <h2 id="product-modal-title">
                    {editingProduct ? "Edit Product" : "Add Product"}
                  </h2>
                  <button
                    type="button"
                    className="modal-close"
                    onClick={() => setIsProductModalOpen(false)}
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={saveProduct}>
                  <label htmlFor="product-name">Product name</label>
                  <input
                    id="product-name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />

                  <label htmlFor="product-category">Category</label>
                  <select
                    id="product-category"
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Home & Living">Home & Living</option>
                    <option value="Accessories">Accessories</option>
                  </select>

                  <label htmlFor="product-price">Price ($)</label>
                  <input
                    id="product-price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleFormChange}
                    required
                  />

                  <label htmlFor="product-stock">Stock quantity</label>
                  <input
                    id="product-stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stock}
                    onChange={handleFormChange}
                    required
                  />

                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProductModalOpen(false);
                        setEditingProduct(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="save-product-button">
                      {editingProduct ? "Save changes" : "Add product"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </main>
      </div>
    </Provider>
  );
}

export default function App() {
  return <Dashboard />;
}
