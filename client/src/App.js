import React, { useState, useEffect } from 'react';
import './App.css';
// 1. Import Supabase
import { createClient } from '@supabase/supabase-js';

// 2. SUPABASE CONFIG 
const supabaseUrl = 'https://filcqkjgjuakgerlkyjz.supabase.co';
const supabaseAnonKey = 'sb_publishable_8TMA0QQk0xzLFdGePjeC3w_ZGWVnjBf';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

let searchController = null;

function App() {
  const [books, setBooks] = useState(() => {
    const saved = localStorage.getItem('myBooks');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  // Auth States
  const [user, setUser] = useState(null); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // 3. MONITOR AUTH STATUS 
  useEffect(() => {
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('myBooks', JSON.stringify(books));
  }, [books]);

  // 4. SIGN UP 
  const handleSignup = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      alert("Signup error: " + error.message);
    } else {
      alert("Verification email sent! Please check your inbox.");
      setIsRegistering(false);
    }
  };

  // 5. LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert("Login failed: " + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- UPDATED SEARCH AND TRACKER LOGIC ---
const handleSearch = async () => {
  if (!query) return;
  if (searchController) searchController.abort();
  searchController = new AbortController();
  setLoading(true);
  
  try {
    // FIXED URL STRUCTURE BELOW
    const apiKey = "AIzaSyBdqygjj6PbqW6Gdpi9xBDpyXdOJ5MX5fA ";
    const apiPath = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`; 
    
    const response = await fetch(apiPath, { signal: searchController.signal });
    
    if (response.status === 429) {
      throw new Error("Google is busy. Please wait and try again.");
    }
    
    if (!response.ok) throw new Error('Search failed to connect');
    
    const data = await response.json();
    setSearchResults(data.items || []);
    setSearchPerformed(true);
  } catch (error) {
    if (error.name !== 'AbortError') {
      alert(error.message);
    }

  } finally {
    setLoading(false);
  }
};

const handleAddBook = (e) => {
  e.preventDefault();
  if (books.some(b => b.title.toLowerCase() === title.toLowerCase())) {
    alert("This book is already in your tracker!");
    return;
  }
  // Use a reliable placeholder service for manual entries
  setBooks([...books, { 
    title, 
    author, 
    id: Date.now(), 
    thumbnail: 'https://placeholder.com' 
  }]);
  setTitle(''); 
  setAuthor('');
};

const deleteBook = (id) => setBooks(books.filter(b => b.id !== id));

return (
  <div className="App" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
    {!user ? (
      <div style={{textAlign: 'center', marginTop: '50px'}}>
        <h1>📚 Book Tracker</h1>
        <h2>{isRegistering ? 'Create Account' : 'Login'}</h2>
        <form onSubmit={isRegistering ? handleSignup : handleLogin}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{display:'block', margin: '10px auto', padding: '10px'}} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{display:'block', margin: '10px auto', padding: '10px'}} 
          />
          <button type="submit" style={{padding: '10px 20px', cursor: 'pointer'}}>
            {isRegistering ? 'Sign Up' : 'Login'}
          </button>
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
          <h2>Find a Book (Google Search)</h2>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." style={{padding: '10px', width: '250px'}} />
          <button onClick={handleSearch} disabled={loading} style={{padding: '10px', marginLeft: '5px', cursor: 'pointer'}}>
            {loading ? 'Searching...' : 'Search Books'}
          </button>

          {!loading && searchPerformed && searchResults.length === 0 && <p style={{ color: 'red' }}>No books found.</p>}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
            {searchResults.map((item) => (
              <div key={item.id} style={{ border: '1px solid #ddd', padding: '15px', width: '160px', background: '#fff', borderRadius: '10px' }}>
            
            <img 
              src={item.volumeInfo.imageLinks?.thumbnail || 'https://placeholder.com'} 
              alt={item.volumeInfo.title} 
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = 'https://placeholder.com';
              }}
              style={{width: '100%', height: '220px', borderRadius: '5px', objectFit: 'cover'}} 
            />

                <p style={{fontSize: '13px', margin: '10px 0', height: '40px', overflow: 'hidden'}}><strong>{item.volumeInfo.title}</strong></p>
                <button 
                  style={{width: '100%', cursor: 'pointer'}} 
                  onClick={() => {
                    if (books.some(b => b.title === item.volumeInfo.title)) {
                      alert("Book already in tracker!");
                      return;
                    }
                    // SAVING GOOGLE DATA WITH ARRAY JOIN FOR AUTHORS
                    setBooks([...books, { 
                      title: item.volumeInfo.title, 
                      author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown', 
                      thumbnail: item.volumeInfo.imageLinks?.smallThumbnail || 'https://placeholder.com',
                      id: item.id 
                    }]);
                  }}
                >
                  + Add
                </button>
              </div>
            ))}
          </div> 
        </section>

        <hr />

        <section style={{marginTop: '40px'}}>
          <h1>My Tracker</h1>
          <form onSubmit={handleAddBook} style={{marginBottom: '20px'}}>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required style={{padding: '8px', marginRight: '5px'}} />
            <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" required style={{padding: '8px', marginRight: '5px'}} />
            <button type="submit" style={{padding: '8px 15px', cursor: 'pointer'}}>Add Manually</button>
          </form>
          
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: '#eee'}}>
                <th style={{padding: '10px', border: '1px solid #ddd'}}>Cover</th>
                <th style={{padding: '10px', border: '1px solid #ddd'}}>Title</th>
                <th style={{padding: '10px', border: '1px solid #ddd'}}>Author</th>
                <th style={{padding: '10px', border: '1px solid #ddd'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => {
                return (
                  <tr key={book.id}>
                    <td style={{padding: '10px', border: '1px solid #ddd', textAlign: 'center'}}>
                      <img 
                        src={book.thumbnail} 
                        alt={book.title} 
                        onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = 'https://placeholder.com';
                        }}
                        style={{ width: '50px', borderRadius: '4px' }} 
                      />
                    </td>
                    <td style={{padding: '10px', border: '1px solid #ddd'}}>{book.title}</td>
                    <td style={{padding: '10px', border: '1px solid #ddd'}}>{book.author}</td>
                    <td style={{padding: '10px', border: '1px solid #ddd', textAlign: 'center'}}>
                      <button 
                        onClick={() => deleteBook(book.id)} 
                        style={{color: 'red', cursor: 'pointer'}}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </>
    )}
  </div>
);}

export default App;