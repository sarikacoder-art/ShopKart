# ShopKart Lab 03 — Setup, Testing and Viva

## Run the project

Open the main ShopKart folder in VS Code and use two terminals.

Terminal 1:

```powershell
cd ShopKart-Lab-01
npm install
npm run dev
```

Terminal 2:

```powershell
cd ShopKart-Lab-02-Frontend
npm install
npm run dev
```

Backend: `http://localhost:5000`  
Frontend: `http://localhost:5173`

## Save these Lab 3 Postman requests

### 1. Create Product

`POST http://localhost:5000/products`

Body → raw → JSON:

```json
{
  "name": "Mechanical Keyboard",
  "description": "RGB mechanical keyboard with blue switches.",
  "price": 2999,
  "category": "Electronics",
  "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
  "stock": 10
}
```

Expected: `201`. Create the other examples from `sample-products.json` one at a time.

### 2. Get All Products

`GET http://localhost:5000/products`

Expected: `200` with `count` and `products`.

### 3. Get Single Product

Copy an `_id` returned by the previous request:

`GET http://localhost:5000/products/PASTE_ID_HERE`

Expected: `200`. Test `abc` as the ID to show `400 Invalid product ID`.

### 4. Search Products

`GET http://localhost:5000/products?search=keyboard`

### 5. Filter Products

`GET http://localhost:5000/products?category=Electronics`

### 6. Combined Search and Filter

`GET http://localhost:5000/products?search=keyboard&category=Electronics`

### 7. Sort Low to High (Bonus)

`GET http://localhost:5000/products?sort=price_asc`

### 8. Sort High to Low (Bonus)

`GET http://localhost:5000/products?sort=price_desc`

## Frontend demonstration

1. Log in and click **Browse Products**.
2. Show that cards came from the database rather than being hardcoded.
3. Search for `keyboard`.
4. Select `Electronics` from the category filter.
5. Demonstrate both sorting choices.
6. Click **View Details** and point out the product ID in the URL.
7. Show the large image, description, price, category, stock, and Add to Cart button.
8. Search for a nonexistent name to demonstrate `No products found.`

## Official viva answers

### 1. Why should product data come from MongoDB instead of being hardcoded in React?

MongoDB provides one central and persistent source of truth. Products can be added or updated without changing and rebuilding React code. The same API data can also be used by multiple clients, and the frontend remains dynamic.

### 2. What is the difference between a URL parameter and a query parameter?

A URL parameter identifies a particular resource and forms part of the path, such as the ID in `/products/:id`. A query parameter comes after `?` and modifies or filters the response, such as `search` in `/products?search=phone`.

### 3. When would you use `/products/:id` versus `/products?category=Electronics`?

I use `/products/:id` when I need one specific product, such as on the details page. I use `/products?category=Electronics` when I need a collection of products filtered by category.

### 4. How does `.map()` help us render products dynamically?

`.map()` goes through the products array and returns one `ProductCard` component for every product. The UI therefore adapts automatically to the API response. Each card receives a stable MongoDB `_id` as its React `key`.

### 5. Why do we need loading and error states?

API calls take time and may fail. A loading state tells users that work is happening instead of showing a blank page. An error state explains that data could not be loaded instead of making the application appear broken.

### 6. What happens when the backend returns an empty array?

The products state becomes an empty array. The component checks `products.length === 0` and displays `No products found` instead of rendering an empty grid.

### 7. Why handle search/filtering on the backend for a huge dataset?

Backend filtering avoids downloading every product to the browser, reduces network usage and browser memory, and allows MongoDB indexes and database queries to process large datasets more efficiently.

### 8. Why separate API/service logic from UI components?

It avoids repeating configuration such as the base URL and credentials. It also keeps components focused on displaying and interacting with the UI, making the code easier to maintain and update.

## Five related viva questions

### 9. What does `useParams()` do?

`useParams()` reads dynamic values from the current React Router URL. On `/products/:id`, it gives the component the actual product ID so it can request `/products/{id}`.

### 10. Why is `key={product._id}` used with `.map()`?

React uses a stable unique key to identify each rendered card and efficiently update the list. The database `_id` is unique and more reliable than an array index.

### 11. How is case-insensitive search implemented?

The backend creates a MongoDB regular-expression condition with `$options: "i"`. The `i` flag makes uppercase and lowercase letters match equally.

### 12. How is the MongoDB query built dynamically?

The controller begins with an empty `query` object. It adds a name condition only when `search` exists and a category condition only when `category` exists. The same `Product.find(query)` call therefore supports no filter, either filter, or both together.

### 13. Why validate a MongoDB ID before `findById()`?

An invalid ID format can cause a Mongoose CastError. `mongoose.Types.ObjectId.isValid()` lets the API respond clearly with status `400`, while a correctly formatted ID with no matching document returns `404`.

