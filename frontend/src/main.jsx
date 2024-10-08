import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/App.css';
import { Provider } from 'react-redux';
import Store from './store/store.js';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from "./component/layout.jsx"// Import your layout component
import Userlogin from './pages/userLogin.jsx';
import NotFound from './component/pageNotfound.jsx';
import Addbook from './pages/addbooks.jsx';
import Displaybooks from './pages/displayBook.jsx';
import ViewDetails from './pages/viewDetail.jsx';
import Profile from './pages/userprofile.jsx';
import Intro from './component/intro.jsx';
import Hordingbooks from './pages/hordingbooks.jsx';
import Authors from './pages/authors.jsx';
import Displayblogs from './pages/blogs.jsx';
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, // Wrap with Layout
    children: [
      { path: "/", element: <Intro /> },
      { path: "/home", element: <Displaybooks /> },
      { path: "/userlogin", element: <Userlogin /> },
      { path: "/userprofile", element: <Profile /> },
      { path: "/addbook", element: <Addbook /> },
      { path: "/detail/:id", element: <ViewDetails /> },
      { path: "/banner/:type", element: <Hordingbooks /> },
      { path: "/authordetails/:name", element: <Authors /> },
      { path: "/blogs", element: <Displayblogs /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={Store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
