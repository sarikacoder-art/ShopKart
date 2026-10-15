# ShopKart — Customer Authentication Service (Lab 01)

This project completes all four required tasks and the bonus **Change Password** task.

## 1. What you are building

The backend follows this request flow:

`Postman → Route → Middleware (protected routes only) → Controller → Model → MongoDB`

- **Model:** defines how customer data is stored.
- **Controller:** contains registration, login, profile, logout, and password-change logic.
- **Route:** connects an HTTP method and URL to a controller.
- **Middleware:** runs between the request and controller to authenticate protected requests.
- **Utility:** contains reusable JWT creation logic.

## 2. Create and open the project in VS Code

### Easiest method using this completed folder

1. Download/extract the `ShopKart-Lab-01` folder.
2. Open VS Code.
3. Select **File → Open Folder** and choose `ShopKart-Lab-01`.
4. Select **Terminal → New Terminal**.

### If creating it manually in VS Code

Create a folder named `ShopKart-Lab-01`, open it in VS Code, and create:

```text
ShopKart-Lab-01/
├── controllers/
│   └── customer.controller.js
├── middlewares/
│   └── auth.middleware.js
├── models/
│   └── customer.model.js
├── routes/
│   └── customer.routes.js
├── utils/
│   └── generateToken.js
├── .env
├── .env.example
├── .gitignore
├── index.js
├── package.json
└── README.md
```

## 3. Install and configure

You need Node.js and either local MongoDB or MongoDB Atlas.

In the VS Code terminal, run:

```bash
npm install
```

Create a file named `.env` in the project root. For local MongoDB:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shopkart
JWT_SECRET=my_shopkart_super_secret_key_2026
NODE_ENV=development
```

For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string. Do not place spaces around `=` and do not upload `.env` to GitHub.

Start the server:

```bash
npm run dev
```

Expected terminal output:

```text
MongoDB connected successfully
Server running at http://localhost:5000
```

If PowerShell blocks `npm`, use Command Prompt as the VS Code terminal or run `npm.cmd install` and `npm.cmd run dev`.

## 4. Test every task in Postman

Use the requests in this exact order because login creates the cookie required by protected routes. Postman normally stores and resends cookies automatically.

### Test 1: Register

- Method: `POST`
- URL: `http://localhost:5000/customers/register`
- Body → raw → JSON:

```json
{
  "fullName": "John Doe",
  "email": "john@gmail.com",
  "password": "john123",
  "phone": "9876543210"
}
```

Expected: `201 Created`. In MongoDB, `password` should look like `$2b$10$...`, never `john123`.

Also verify these failures:

- Remove one field → `400`.
- Use a password shorter than 6 characters → `400`.
- Send the same email again → `409`.

### Test 2: Login

- Method: `POST`
- URL: `http://localhost:5000/customers/login`
- Body:

```json
{
  "email": "john@gmail.com",
  "password": "john123"
}
```

Expected: `200 OK`. Open Postman's **Cookies** section for `localhost`; a cookie named `token` should be present with **HttpOnly** enabled.

Wrong email and wrong password must both return the same `401 Invalid credentials` response. This avoids revealing which registered accounts exist.

### Test 3: My profile

- Method: `GET`
- URL: `http://localhost:5000/customers/me`
- No body is needed.

Expected: `200 OK` with customer data and no password. Delete the cookie and repeat; it should return `401`.

### Test 4: Change password (bonus)

- Method: `PATCH`
- URL: `http://localhost:5000/customers/change-password`
- Body:

```json
{
  "oldPassword": "john123",
  "newPassword": "john456"
}
```

Expected: `200 OK`. The old password should no longer work for login; the new one should work.

### Test 5: Logout

- Method: `POST`
- URL: `http://localhost:5000/customers/logout`

Expected: `200 OK`. The cookie is cleared. Calling `/customers/me` afterward should return `401`.

## 5. Understand every file from scratch

### `index.js` — application entry point

`require(...)` imports packages and files using CommonJS. `express()` creates the application. `express.json()` parses JSON and makes it available as `req.body`. `cookieParser()` parses the Cookie header and creates `req.cookies`. `app.use("/customers", customerRoutes)` gives every customer route the `/customers` prefix. `mongoose.connect(...)` establishes the database connection before `app.listen(...)` starts accepting requests.

### `customer.model.js` — database blueprint

A Mongoose schema defines fields, types, and validation. `{ timestamps: true }` automatically adds `createdAt` and `updatedAt`. `unique: true` creates a unique database index; it is not merely a normal validator. `lowercase` and `trim` normalize emails. `select: false` prevents password from being returned by normal queries. Login deliberately uses `.select("+password")` because it needs the hash for comparison.

### `customer.controller.js` — business logic

Registration validates input, checks for an existing email, hashes the password with `bcrypt.hash(password, 10)`, and saves the customer. Login retrieves the hash and uses `bcrypt.compare`; it never decrypts anything. After a match, it signs a JWT and sends it as a cookie. Profile uses the customer already placed in `req.user`. Logout instructs the browser/Postman to expire the cookie. Change password verifies the old password and stores a new hash.

### `generateToken.js` — JWT utility

`jwt.sign(payload, secret, options)` creates a signed token. The payload contains only `customerId`; the password must never be placed in it. `expiresIn: "1d"` makes the token expire after one day. A JWT is signed and encoded, not encrypted, so its payload can be decoded by anyone holding it.

### `auth.middleware.js` — route protection

The middleware reads `req.cookies.token`, verifies the signature and expiry with `jwt.verify`, extracts `customerId`, finds that customer, assigns it to `req.user`, and calls `next()`. If any step fails, it returns `401` and does not call the controller.

### `customer.routes.js` — endpoint map

The order `router.get("/me", protect, getMyProfile)` means Express first runs `protect`; only if it calls `next()` will `getMyProfile` execute. Register and login are public. Profile, logout, and change-password are protected.

## 6. Complete authentication flow

### Registration

1. Client sends name, email, plain password, and phone.
2. Controller validates the values.
3. bcrypt creates a salted one-way hash.
4. Only that hash is stored in MongoDB.

### Login

1. Client sends email and password.
2. Server finds the email and retrieves the stored hash.
3. bcrypt checks whether the supplied password produces a matching result.
4. Server signs a JWT containing the customer ID.
5. Server sends the JWT in an HttpOnly cookie.

### Protected request

1. Postman/browser sends the cookie automatically.
2. Middleware verifies the JWT.
3. Middleware loads the customer and sets `req.user`.
4. Controller returns safe profile fields.

### Logout

The server clears the cookie. JWT authentication is normally stateless, so this removes the client's copy but does not create a server-side session. A stolen, unexpired token could remain usable unless the application adds revocation or token versioning.

## 7. Status codes to remember

| Code | Meaning | Used here |
|---|---|---|
| 200 | Request succeeded | Login, profile, logout, change password |
| 201 | New resource created | Registration |
| 400 | Invalid/missing input | Missing fields, short password |
| 401 | Not authenticated | Wrong login or invalid/missing token |
| 409 | Conflict with existing data | Duplicate email |
| 404 | Resource/route not found | Unknown endpoint |
| 500 | Unexpected server failure | Database/server error |

## 8. Viva preparation — the five official questions

### 1. Why bcrypt instead of encrypting passwords?

**Answer:** Encryption is reversible using a key, so leaked encrypted passwords may be recovered if the key is stolen. bcrypt is a one-way password hashing algorithm. It automatically uses a salt and is deliberately slow, which makes precomputed rainbow-table and brute-force attacks harder. During login we use `bcrypt.compare`; we never decrypt the password.

**Follow-up: What is salt?** A unique random value mixed with a password before hashing. Therefore, two customers using the same password still get different hashes.

**Follow-up: What does 10 mean?** It is the salt rounds or cost factor. A higher value makes hashing slower and more resistant to brute force, but also uses more server resources.

### 2. What is typically stored in a JWT payload?

**Answer:** Minimal non-sensitive claims needed to identify/authorize a user, such as user ID, role, and standard claims including issued-at and expiry. Here we store only `customerId`. Passwords, secrets, OTPs, and sensitive private data should never be included because a normal JWT payload is encoded, not encrypted.

**Follow-up: What are the three JWT parts?** Header, payload, and signature, separated by dots. The header describes the algorithm/token type; payload holds claims; signature detects modification.

### 3. Why is HttpOnly important?

**Answer:** HttpOnly prevents frontend JavaScript from reading the cookie through `document.cookie`. This reduces token theft through XSS. The browser can still automatically send the cookie with matching HTTP requests. HttpOnly does not itself prevent CSRF, so `SameSite`, Secure, and CSRF protection may also be needed.

### 4. Why must passwords never be returned to the frontend?

**Answer:** The frontend does not need the password or hash. Returning it exposes sensitive data through browser tools, logs, network responses, caches, or frontend bugs. Even a bcrypt hash can be attacked offline, so it must remain protected. This project uses selected response fields plus `select: false` as defense in depth.

### 5. What is the purpose of authentication middleware?

**Answer:** It centralizes repeated authentication logic before protected controllers run. It reads and verifies the token, finds the logged-in customer, attaches the customer to `req.user`, calls `next()` when valid, and returns `401` when invalid. This avoids duplicating the same logic in every protected controller.

## 9. Extra likely viva questions

### Authentication vs authorization?

Authentication answers “Who are you?” Login and token verification authenticate. Authorization answers “What are you allowed to do?” A future admin-only product route might check `req.user.role`.

### Hashing vs encryption?

Hashing is one-way and is used for password verification. Encryption is reversible with a key and is used when original data must later be recovered.

### Why use `bcrypt.compare` rather than hashing again and comparing strings?

Each bcrypt hash contains a salt and cost. Hashing the same password again normally creates a different hash. `compare` reads the salt/cost from the stored hash and securely checks the candidate.

### What is JWT and why use it?

JWT is a signed token carrying claims. The server can verify its integrity without storing a session for every login, making authentication stateless and useful across APIs. Tradeoffs include harder immediate revocation and the need to protect the token carefully.

### Does JWT hide its payload?

No. Standard JWT payload data is Base64URL-encoded and readable. The signature proves it was not altered using the secret; it does not make the payload confidential.

### `jwt.sign` vs `jwt.verify` vs `jwt.decode`?

- `sign` creates a signed token.
- `verify` checks signature and expiry, then returns the payload.
- `decode` only reads data and must not be trusted for authentication.

### Why keep `JWT_SECRET` in `.env`?

It is configuration and sensitive information. Keeping it outside source code makes accidental GitHub exposure less likely and allows different values in development and production.

### Why normalize email to lowercase?

It prevents `John@gmail.com` and `john@gmail.com` from being treated as separate accounts and makes login consistent.

### Why check duplicate email in code if the schema says `unique: true`?

The code check gives a clear response before insertion. The database unique index is the final protection against simultaneous requests. That is why error code `11000` is also handled.

### Why use asynchronous functions and `await`?

Database queries and password hashing take time. `await` lets Node handle other work while waiting and gives readable error handling with `try/catch`.

### What are `req`, `res`, and `next`?

`req` contains incoming request data; `res` creates the response; `next` passes control to the next middleware/controller in the chain.

### What are `req.body`, `req.params`, `req.query`, and `req.cookies`?

- `req.body`: JSON/form data sent in the body.
- `req.params`: dynamic URL values, such as `/customers/:id`.
- `req.query`: values after `?`, such as `?page=2`.
- `req.cookies`: parsed cookies after using `cookie-parser`.

### Why is `express.json()` needed?

It parses JSON request bodies. Without it, `req.body` will usually be undefined for JSON sent by Postman.

### Why is cookie-parser needed?

It parses the incoming Cookie header and provides a convenient `req.cookies` object. It does not create authentication or validate JWTs.

### What do Secure and SameSite cookie flags do?

`Secure` sends a cookie only over HTTPS. `SameSite` controls cross-site cookie sending and helps reduce CSRF. `strict` offers strong restriction but can affect some cross-site flows.

### Why is Secure false during local development?

Local development commonly uses plain HTTP. A Secure cookie would not be sent over it. In production, `NODE_ENV=production` makes Secure true and HTTPS should be used.

### What happens when a JWT expires?

`jwt.verify` throws an error. The middleware catches it and sends `401`, requiring the customer to log in again.

### What is MVC?

Model manages the data shape/database, View is the client-facing presentation (not part of this backend-only lab), and Controller handles request logic. Routes map URLs to controllers; middleware handles cross-cutting steps such as authentication.

### Why PATCH for change password?

PATCH represents a partial update to an existing customer. We change only the password rather than replacing the entire customer resource.

### Why should logout normally be protected?

It keeps the API contract consistent by requiring a logged-in user. Clearing a cookie can technically be allowed publicly too, but the lab marks logout as protected.

### What if MongoDB is down?

Initial connection fails, the error is logged, and the process exits. During a controller operation, unexpected failures return `500 Internal server error` without exposing internal details.

## 10. Common mistakes and fixes

- **`req.body` is undefined:** add `app.use(express.json())` before routes and choose JSON in Postman.
- **`req.cookies` is undefined:** install/import `cookie-parser` and call `app.use(cookieParser())` before routes.
- **MongoDB `ECONNREFUSED`:** start the local MongoDB service or correct the Atlas URI/network access.
- **`querySrv ECONNREFUSED`:** often a DNS/network problem or an incorrect Atlas `mongodb+srv` string.
- **Cookie not sent:** use the same host consistently (`localhost`, not sometimes `127.0.0.1`), log in first, and inspect Postman's cookie jar.
- **Always getting 401:** check the cookie, `JWT_SECRET`, expiry, and whether the referenced customer still exists.
- **`require is not defined`:** remove `"type": "module"` from `package.json` because this solution uses CommonJS.
- **Duplicate error appears as 500:** ensure MongoDB's unique index exists and handle error code `11000`.
- **Password missing during login query:** include `.select("+password")` because the schema sets `select: false`.

## 11. One-minute viva explanation of the project

“I built ShopKart's customer authentication backend using Node, Express, MongoDB, and Mongoose in MVC structure. During registration, I validate all inputs, normalize the email, reject duplicates, and hash the password using bcrypt before storing it. During login, I retrieve the stored hash, verify the supplied password with bcrypt, create a JWT containing only the customer ID, and place it in an HttpOnly cookie. Protected routes use authentication middleware, which verifies the cookie token, loads the customer, and attaches it to `req.user`. The profile route returns safe fields only, and logout clears the cookie. I also implemented the bonus change-password API, which verifies the old password and hashes the new one before saving.”

## 12. Final demonstration checklist

- [ ] Folder structure follows MVC.
- [ ] MongoDB and server connect without errors.
- [ ] Valid registration returns 201.
- [ ] Duplicate registration returns 409.
- [ ] Short/missing input returns 400.
- [ ] MongoDB contains a bcrypt hash, not plain password.
- [ ] Valid login returns 200 and sets an HttpOnly token cookie.
- [ ] Wrong email/password both return the same 401 response.
- [ ] `/customers/me` succeeds with cookie and fails without it.
- [ ] No response includes `password`.
- [ ] Change-password works and stores a new hash.
- [ ] Logout clears the cookie and profile then returns 401.

