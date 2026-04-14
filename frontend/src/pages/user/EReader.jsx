import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function EReader() {
  const { id, chapterNumber } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [chaptersInfo, setChaptersInfo] = useState([]);
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reader Settings
  const [theme, setTheme] = useState('light'); // light, dark, sepia
  const [fontSize, setFontSize] = useState(1.1); // in rem
  const [fontFamily, setFontFamily] = useState('serif'); // serif, sans-serif
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    // Load book details and chapter list
    const loadBookData = async () => {
      try {
        const [bookRes, chapRes] = await Promise.all([
          axios.get(`${API}/books/${id}`, { headers }),
          axios.get(`${API}/books/${id}/chapters`, { headers })
        ]);
        setBook(bookRes.data.book);
        setChaptersInfo(chapRes.data.chapters || []);
        
        // If no chapter number provided in URL but chapters exist, redirect to chapter 1
        if (!chapterNumber && chapRes.data.chapters.length > 0) {
          navigate(`/read/${id}/1`, { replace: true });
        } else if (chapRes.data.chapters.length === 0) {
          setError('No chapters available for this book yet.');
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load book or chapters.');
        setLoading(false);
      }
    };
    loadBookData();
  }, [id]);

  useEffect(() => {
    // Load specific chapter content when chapterNumber changes
    if (!chapterNumber) return;
    
    const loadChapterContent = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API}/books/${id}/chapters/${chapterNumber}`, { headers });
        setChapter(res.data.chapter);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error(err);
        setError('Failed to load chapter content.');
      }
      setLoading(false);
    };
    loadChapterContent();
  }, [id, chapterNumber]);

  useEffect(() => {
    // Apply theme class to body/html to prevent white flashes at edges if possible
    document.documentElement.setAttribute('data-reader-theme', theme);
    return () => document.documentElement.removeAttribute('data-reader-theme');
  }, [theme]);

  if (loading && !chapter) {
    return (
      <div className={`reader-wrapper theme-${theme}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || (!loading && !chapter)) {
    return (
      <div className={`reader-wrapper theme-${theme}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
        <h2>{error || 'Chapter not found.'}</h2>
        <Link to={`/books/${id}`} className="btn btn-outline" style={{ display: 'inline-flex', padding: '0.5rem 1rem' }}>
          ← Back to Book
        </Link>
      </div>
    );
  }

  const currentChpNum = parseInt(chapterNumber);
  const maxChpNum = chaptersInfo.length > 0 ? Math.max(...chaptersInfo.map(c => c.chapter_number)) : 1;

  const handleNext = () => {
    if (currentChpNum < maxChpNum) {
      navigate(`/read/${id}/${currentChpNum + 1}`);
    }
  };

  const handlePrev = () => {
    if (currentChpNum > 1) {
      navigate(`/read/${id}/${currentChpNum - 1}`);
    }
  };

  return (
    <div className={`reader-wrapper theme-${theme}`}>
      {/* Top Header Navigation */}
      <header className="reader-header">
        <div className="reader-header-left">
          <Link to={`/books/${id}`} className="reader-back-btn" title="Back to Book Details">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <div className="reader-book-title">{book?.title || 'Loading...'}</div>
        </div>

        <div className="reader-header-right">
          <button className={`reader-icon-btn ${showToc ? 'active' : ''}`} onClick={() => { setShowToc(!showToc); setShowSettings(false); }} title="Table of Contents">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>
          <button className={`reader-icon-btn ${showSettings ? 'active' : ''}`} onClick={() => { setShowSettings(!showSettings); setShowToc(false); }} title="Settings">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </button>
        </div>
      </header>

      {/* Slide-out Panels */}
      {showToc && (
        <div className="reader-panel toc-panel">
          <div className="panel-header">
            <h3>Table of Contents</h3>
            <button className="panel-close" onClick={() => setShowToc(false)}>✕</button>
          </div>
          <ul className="toc-list">
            {chaptersInfo.map(ch => (
              <li key={ch.id} className={ch.chapter_number === currentChpNum ? 'active' : ''}>
                <Link to={`/read/${id}/${ch.chapter_number}`} onClick={() => setShowToc(false)}>
                  {ch.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSettings && (
        <div className="reader-panel settings-panel">
          <div className="panel-header">
            <h3>Reading Settings</h3>
            <button className="panel-close" onClick={() => setShowSettings(false)}>✕</button>
          </div>
          <div className="settings-content">
            <div className="settings-group">
              <label>Theme</label>
              <div className="theme-toggle">
                <button className={`theme-btn btn-light ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>Light</button>
                <button className={`theme-btn btn-sepia ${theme === 'sepia' ? 'active' : ''}`} onClick={() => setTheme('sepia')}>Sepia</button>
                <button className={`theme-btn btn-dark ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>Dark</button>
              </div>
            </div>
            
            <div className="settings-group">
              <label>Font Size</label>
              <div className="font-size-controls">
                <button onClick={() => setFontSize(Math.max(0.8, fontSize - 0.1))}>A-</button>
                <span>{Math.round(fontSize * 100)}%</span>
                <button onClick={() => setFontSize(Math.min(2.5, fontSize + 0.1))}>A+</button>
              </div>
            </div>

            <div className="settings-group">
              <label>Font Family</label>
              <div className="font-family-controls">
                <button className={`font-btn serif ${fontFamily === 'serif' ? 'active' : ''}`} onClick={() => setFontFamily('serif')}>Serif</button>
                <button className={`font-btn sans ${fontFamily === 'sans-serif' ? 'active' : ''}`} onClick={() => setFontFamily('sans-serif')}>Sans Serif</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Reading Area - Paginated */}
      <PaginatedReaderArea 
         chapter={chapter} 
         fontSize={fontSize} 
         fontFamily={fontFamily}
         currentChpNum={currentChpNum}
         maxChpNum={maxChpNum}
         handleNextChapter={handleNext}
         handlePrevChapter={handlePrev}
         theme={theme}
      />
    </div>
  );
}

// Child Component to handle the pagination logic perfectly without re-rendering everything
function PaginatedReaderArea({ chapter, fontSize, fontFamily, currentChpNum, maxChpNum, handleNextChapter, handlePrevChapter, theme }) {
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed internally
  
  // Swipe State
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);

  const containerRef = useState(null);

  // Recalculate layout
  useEffect(() => {
    const el = document.getElementById('paginated-text-track');
    if (el) {
       // Allow DOM to update first
       setTimeout(() => {
         const scrollW = el.scrollWidth;
         const clientW = el.clientWidth;
         const tp = Math.ceil(scrollW / clientW);
         setTotalPages(tp || 1);
         setCurrentPage(0); // Reset to page 0 on chapter change/resize
       }, 100);
    }
  }, [chapter.id, fontSize, fontFamily]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const el = document.getElementById('paginated-text-track');
      if (el) {
         setTotalPages(Math.ceil(el.scrollWidth / el.clientWidth));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const goNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(p => p + 1);
    } else if (currentChpNum < maxChpNum) {
      handleNextChapter();
    }
  };

  const goPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    } else if (currentChpNum > 1) {
      handlePrevChapter();
    }
  };

  // Click Zones
  const handleViewportClick = (e) => {
    if (Math.abs(offsetX) > 10) return; // Ignore if user was dragging
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) {
      goPrevPage();
    } else if (x > rect.width * 0.7) {
      goNextPage();
    }
  };

  // Dragging Events
  const handlePointerDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX || e.touches?.[0].clientX);
    setOffsetX(0);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX || e.touches?.[0].clientX;
    setOffsetX(currentX - startX);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (offsetX < -50) {
      goNextPage();
    } else if (offsetX > 50) {
      goPrevPage();
    }
    setOffsetX(0);
  };

  const currentStyles = {
    fontFamily: fontFamily === 'serif' ? 'Georgia, "Times New Roman", serif' : 'Inter, system-ui, sans-serif'
  };

  return (
    <main className="reader-content-area" style={{ padding: '0', overflow: 'hidden' }}>
      <div 
        className="reader-viewport"
        style={{ 
          height: 'calc(100vh - 120px)', 
          width: '100%', 
          overflow: 'hidden',
          position: 'relative',
          cursor: isDragging ? 'grabbing' : 'auto'
        }}
        onClick={handleViewportClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div 
           id="paginated-text-track"
           style={{
             height: 'calc(100vh - 120px)', // Fixed height guarantees column flow!
             width: '100%',
             transform: `translateX(calc(-${currentPage * 100}vw + ${offsetX}px))`,
             transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
             columnWidth: '100%',
             columnGap: '8vw',
             columnFill: 'auto',
             padding: '3rem 4vw', // 4vw matching the 8vw gap to total 100vw shifts
             boxSizing: 'border-box'
           }}
        >
          <div style={currentStyles}>
             <h1 className="chapter-title" style={{ marginTop: '0', fontSize: `${fontSize * 1.5}rem` }}>{chapter.title}</h1>
             <div 
               className="chapter-text paginated-content"
               style={{ 
                 fontSize: `${fontSize}rem`,
                 lineHeight: 1.8,
                 marginTop: '2rem'
               }}
               dangerouslySetInnerHTML={{ __html: chapter.content }}
             />
          </div>
        </div>
      </div>

      {/* Progress Footer */}
      <div className="reader-footer" style={{ 
          height: '60px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '0 2rem',
          borderTop: '1px solid rgba(128,128,128,0.1)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.85rem',
          opacity: 0.8
        }}>
        <div>{currentChpNum > 1 ? `Chapter ${currentChpNum-1} ←` : ''}</div>
        <div style={{ fontWeight: 600 }}>
           Chapter {currentChpNum} • Page {currentPage + 1} / {totalPages}
        </div>
        <div>{(currentChpNum < maxChpNum) ? `→ Chapter ${currentChpNum+1}` : ''}</div>
      </div>
    </main>
  );
}
