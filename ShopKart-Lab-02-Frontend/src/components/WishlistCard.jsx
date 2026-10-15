import { Link } from "react-router-dom";

function WishlistCard({ product, removing, onRemove }) {
  return (
    <div className="product-card wishlist-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.category}</p>
      <p><b>₹{product.price.toLocaleString("en-IN")}</b></p>
      <p>{product.stock > 0 ? `${product.stock} units left` : "Out of stock"}</p>

      <div className="wishlist-actions">
        <Link className="details-link" to={`/products/${product._id}`}>
          View Details
        </Link>

        <button
          className="remove-button"
          onClick={() => onRemove(product._id)}
          disabled={removing}
        >
          {removing ? "Removing..." : "Remove ♥"}
        </button>
      </div>
    </div>
  );
}

export default WishlistCard;
