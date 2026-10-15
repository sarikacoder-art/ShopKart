# ShopKart Lab 02 — React Authentication Frontend

This frontend connects to the ShopKart Lab 01 backend and completes registration, login, protected home, and logout.

## What is included

- `/register`: controlled registration form, validation, API call, redirect to login
- `/login`: login API call with cookies, error display, redirect to home
- `/home`: calls `/customers/me`, displays customer details, redirects unauthenticated users
- Navbar logout: clears the backend cookie and returns to login
- Responsive ShopKart interface

## Run in VS Code

Keep Lab 01 and Lab 02 in separate folders. Open the parent `ShopKart` folder in VS Code so both are visible.

### Terminal 1 — backend

```powershell
cd ShopKart-Lab-01
npm run dev
```

The backend must show:

```text
MongoDB connected successfully
Server running at http://localhost:5000
```

### Terminal 2 — frontend

Click the plus button in the terminal panel to open a second terminal:

```powershell
cd ShopKart-Lab-02-Frontend
npm install
npm run dev
```

Open the Vite URL, normally:

```text
http://localhost:5173
```

Do not close either terminal. The frontend needs the backend.

## Test the complete lab

1. Open `/register` and intentionally submit empty fields; verify the error.
2. Enter a new customer and create the account.
3. Verify automatic redirection to `/login` and the success message.
4. Try a wrong password; verify `Invalid Credentials`.
5. Log in correctly; verify redirection to `/home`.
6. Verify name, email, and phone are fetched from `/customers/me`.
7. Click Logout; verify redirection to `/login`.
8. Manually type `/home`; verify automatic redirection to `/login`.

Use a fresh email whenever you repeat the registration demonstration.

## How the API connection works

`src/services/api.js` creates one Axios instance:

```js
const api = axios.create({
  baseURL: "/customers",
  withCredentials: true,
});
```

All pages reuse it. `withCredentials: true` allows cookies to be sent and received. During development, `vite.config.js` proxies `/customers` requests to `http://localhost:5000`, so the browser can use the Lab 01 API without cross-origin errors.

## Viva answers from the sheet

### 1. Why do we use `withCredentials: true`?

It tells Axios to include credentials such as cookies in API requests and accept authentication cookies from responses. ShopKart stores the JWT in an HttpOnly cookie, so authenticated requests such as `/customers/me` and `/customers/logout` need credentials enabled.

### 2. What is a controlled component?

A controlled form element gets its value from React state and updates that state through an event handler. For example, `value={email}` connects the input to state, while `onChange` calls `setEmail`. React therefore becomes the single source of truth for the form value.

### 3. Why do we use `useNavigate()`?

`useNavigate()` performs navigation from JavaScript after an action. After successful registration we navigate to `/login`; after login we navigate to `/home`; after logout or failed authentication we navigate back to `/login`.

### 4. How are cookies sent from React to the backend?

The browser stores the cookie received after login. Axios uses `withCredentials: true`, so the browser automatically includes the matching cookie in later requests. React does not read the JWT because the cookie is HttpOnly.

### 5. How do we protect frontend routes?

The `/home` page requests `/customers/me` when it loads. If the backend verifies the cookie, the profile is displayed. If the backend returns `401`, React redirects to `/login`. The backend remains the real security boundary; a frontend redirect alone is not sufficient security.

## Five closely related viva questions

### 6. What is `useState()` used for?

`useState()` stores changing component data and triggers a re-render when that data changes. This project uses it for form values, error messages, loading states, and customer details.

### 7. What is `useEffect()` used for on the Home page?

`useEffect()` runs the profile request after the Home component is rendered. With `[navigate]` as the dependency array, the effect does not run after every ordinary state update.

### 8. What is the difference between `<Link>` and `useNavigate()`?

`<Link>` is used for navigation the user directly clicks, such as “Create an account.” `useNavigate()` is used for programmatic navigation after logic, such as redirecting after successful login.

### 9. Why do we use `event.preventDefault()` in form submission?

An HTML form normally refreshes the entire page when submitted. `preventDefault()` stops that behaviour so React can validate the form, call the API asynchronously, display errors, and navigate without a full page reload.

### 10. Why is checking authentication only in React not secure?

Users can modify frontend code or directly call APIs. Therefore, React redirects improve user experience, but the backend middleware must still verify the JWT and return `401` for unauthorized requests.

## One-minute demonstration explanation

“This is the React frontend for my ShopKart authentication backend. I configured three routes using React Router: register, login and home. My forms use controlled components, so React state stores every input. Axios calls the Lab 01 APIs, and `withCredentials` allows the JWT HttpOnly cookie to travel automatically. After registration, the customer is redirected to login; after successful login, they are redirected to the protected home page. Home calls `/customers/me` to validate the session and display customer information. If that call returns 401, it redirects to login. Finally, the navbar logout button calls the logout API, which clears the cookie, and then redirects back to login.”

