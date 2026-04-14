import React, { useState, useEffect } from 'react';
import './App.css';
import { createClient } from '@supabase/supabase-js';

// 1. SUPABASE CONFIG 
const supabaseUrl = 'https://filcqkjgjuakgerlkyjz.supabase.co';
const supabaseAnonKey = 'sb_publishable_8TMA0QQk0xzLFdGePjeC3w_ZGWVnjBf';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

let searchController = null;

function App() {
  // State for Books Read
  const [books, setBooks] = useState(() => {
    const saved = localStorage.getItem('myBooks');
    return saved ? JSON.parse(saved) : [];
  });

  // NEW: State for Books to Read (Wishlist)
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('myWishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [user, setUser] = useState(null); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Monitor Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Sync both lists to localStorage
  useEffect(() => {
    localStorage.setItem('myBooks', JSON.stringify(books));
    localStorage.setItem('myWishlist', JSON.stringify(wishlist));
  }, [books, wishlist]);

  const handleSignup = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("Signup error: " + error.message);
    else { alert("Verification email sent!"); setIsRegistering(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Login failed: " + error.message);
  };

  const handleLogout = async () => await supabase.auth.signOut();

  const handleSearch = async () => {
    if (!query) return;
    if (searchController) searchController.abort();
    searchController = new AbortController();
    setLoading(true);

    try {
      const apiKey = "AIzaSyBdqygjj6PbqW6Gdpi9xBDpyXdOJ5MX5fA";
      const apiPath = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`;
      const response = await fetch(apiPath, { signal: searchController.signal });
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (error) {
      if (error.name !== 'AbortError') alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReadManual = (e) => {
    e.preventDefault();
    setBooks([...books, { title, author, id: Date.now(), thumbnail: 'https://placeholder.com' }]);
    setTitle(''); setAuthor('');
  };

  const deleteRead = (id) => setBooks(books.filter(b => b.id !== id));
  const deleteWish = (id) => setWishlist(wishlist.filter(b => b.id !== id));

  return (
    <div className="App" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      {!user ? (
        <div style={{textAlign: 'center', marginTop: '50px'}}>
          <h1>📚 Book Tracker</h1>
          <h2>{isRegistering ? 'Create Account' : 'Login'}</h2>
          <form onSubmit={isRegistering ? handleSignup : handleLogin}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{display:'block', margin: '10px auto', padding: '10px'}} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{display:'block', margin: '10px auto', padding: '10px'}} />
            <button type="submit" style={{padding: '10px 20px', cursor: 'pointer'}}>{isRegistering ? 'Sign Up' : 'Login'}</button>
          </form>
          <p onClick={() => setIsRegistering(!isRegistering)} style={{cursor: 'pointer', color: 'blue', textDecoration: 'underline'}}>
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Sign Up'}
          </p>
        </div>
      ) : (
        <>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p>Welcome, <strong>{user.email}</strong>!</p>
            <button onClick={handleLogout} style={{cursor: 'pointer'}}>Logout</button>
          </header>

          <section style={{textAlign: 'center', margin: '40px 0'}}>
            <h2>Find a Book!</h2>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." style={{padding: '10px', width: '250px'}} />
            <button onClick={handleSearch} disabled={loading} style={{padding: '10px', marginLeft: '5px', cursor: 'pointer'}}>
              {loading ? 'Searching...' : 'Search Books'}
            </button>

              <form onSubmit={handleAddReadManual} style={{marginBottom: '20px'}}>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required style={{padding: '8px', marginRight: '5px'}} />
              <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" required style={{padding: '8px', marginRight: '5px'}} />
              <button type="submit" style={{padding: '8px 15px', cursor: 'pointer'}}>Add Manually</button>
            </form>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
              {searchResults.map((item) => (
                <div key={item.id} style={{ border: '1px solid #ddd', padding: '15px', width: '160px', background: '#fff', borderRadius: '10px' }}>
                  <img src={item.volumeInfo.imageLinks?.thumbnail || 'https://placeholder.com'} alt={item.volumeInfo.title} style={{width: '100%', height: '200px', objectFit: 'cover'}} />
                  <p style={{fontSize: '12px', fontWeight: 'bold', margin: '10px 0', height: '35px', overflow: 'hidden'}}>{item.volumeInfo.title}</p>
                  
                  {/* Two Buttons: One for Read, One for Wishlist */}
                  <button style={{width: '100%', marginBottom: '5px', cursor: 'pointer'}} onClick={() => setBooks([...books, { title: item.volumeInfo.title, author: item.volumeInfo.authors?.join(', ') || 'Unknown', thumbnail: item.volumeInfo.imageLinks?.thumbnail, id: Date.now() + Math.random() }])}>+ Read</button>
                  <button style={{width: '100%', cursor: 'pointer', background: 'green'}} onClick={() => setWishlist([...wishlist, { title: item.volumeInfo.title, author: item.volumeInfo.authors?.join(', ') || 'Unknown', thumbnail: item.volumeInfo.imageLinks?.thumbnail, id: Date.now() + Math.random() }])}>+ Wishlist</button>
                </div>
              ))}
            </div> 
          </section>

          <hr />

          {/* SECTION: BOOKS READ */}
          <section style={{marginTop: '40px'}}>
            <h1>Books Read</h1>
          
            
            <BookTable list={books} onDelete={deleteRead} />
          </section>

          {/* SECTION: BOOKS TO READ (WISHLIST) */}
          <section style={{marginTop: '60px', paddingBottom: '50px'}}>
            <h1>Books to Read (Wishlist)</h1>
            <BookTable list={wishlist} onDelete={deleteWish} />
          </section>
        </>
      )}
    </div>
  );
}

// Reusable Table Component to keep code clean
function BookTable({ list, onDelete }) {
  return (
    <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px'}}>
      <thead>
        <tr style={{background: '#eee'}}>
          <th style={{padding: '10px', border: '1px solid #ddd'}}>Cover</th>
          <th style={{padding: '10px', border: '1px solid #ddd'}}>Title</th>
          <th style={{padding: '10px', border: '1px solid #ddd'}}>Author</th>
          <th style={{padding: '10px', border: '1px solid #ddd'}}>Action</th>
        </tr>
      </thead>
      <tbody>
        {list.map((book) => (
          <tr key={book.id}>
            <td style={{padding: '10px', border: '1px solid #ddd', textAlign: 'center'}}>
              <img src={book.thumbnail || 'https://placeholder.com'} alt={book.title} style={{ width: '40px' }} />
            </td>
            <td style={{padding: '10px', border: '1px solid #ddd'}}>{book.title}</td>
            <td style={{padding: '10px', border: '1px solid #ddd'}}>{book.author}</td>
            <td style={{padding: '10px', border: '1px solid #ddd', textAlign: 'center'}}>
              <button onClick={() => onDelete(book.id)} style={{color: 'red', cursor: 'pointer', border: 'none', background: 'none'}}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default App;