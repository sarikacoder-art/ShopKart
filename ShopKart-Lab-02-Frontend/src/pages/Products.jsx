import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import api from "../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await api.get("/products", {
          params: { search: search || undefined, category: category || undefined, sort: sort || undefined },
        });
        setProducts(response.data.products);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category, sort]);

  return (
    <div>
      <Navbar />
      <main className="products-page">
        <h1>Products</h1>
        <SearchBar
          search={search}
          category={category}
          sort={sort}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
          onSortChange={setSort}
        />

        {loading && <p>Loading products...</p>}
        {error && <p className="error">Something went wrong while loading products.</p>}
        {!loading && !error && products.length === 0 && <p>No products found.</p>}
        {!loading && !error && products.length > 0 && (
          <div className="product-grid">
            {products.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        )}
      </main>
    </div>
  );
}

export default Products;
