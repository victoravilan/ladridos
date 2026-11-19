import React, { useState, useEffect, useCallback } from 'react'
import {
  Home, BookOpen, MapPin, User as UserIcon, Upload,
  Heart, MessageCircle, Share2, Search, LogOut, X,
  Download, PawPrint, Store, Navigation, Clock, Filter, ChevronLeft
} from 'lucide-react'

const API_BASE = '/api'

export default function App() {
  const [posts, setPosts] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('home')

  // Modals
  const [showLogin, setShowLogin] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showBreedDetail, setShowBreedDetail] = useState(null)

  // PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({
    nombre: '', email: '', password: '',
    nombrePerro: '', razaPerro: '', mesNacimiento: '', anioNacimiento: ''
  })
  const [isRegister, setIsRegister] = useState(false)
  const [postData, setPostData] = useState({ raza: '', historia: '', archivo: null })
  const [commentText, setCommentText] = useState({})
  const [authError, setAuthError] = useState('')

  // Caninoteca
  const [breeds, setBreeds] = useState([])
  const [breedSearch, setBreedSearch] = useState('')
  const [randomBreed, setRandomBreed] = useState(null)
  const [breedGroupFilter, setBreedGroupFilter] = useState('')

  // Pipicanes & Stores
  const [pipicanes, setPipicanes] = useState([])
  const [stores, setStores] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState('')

  // User profile posts
  const [userPosts, setUserPosts] = useState([])

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem('ladridos_token')
    if (token) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.user) {
            setUser(data.user)
            loadUserPosts(data.user.userId)
          } else {
            localStorage.removeItem('ladridos_token')
          }
        })
        .catch(() => localStorage.removeItem('ladridos_token'))
    }
  }, [])

  // PWA install handler
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (!localStorage.getItem('ladridos_installed')) {
        setShowInstallBanner(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setShowInstallBanner(false)
      localStorage.setItem('ladridos_installed', 'true')
    })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Load posts
  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/posts`)
      if (res.ok) {
        const data = await res.json()
        setPosts(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Error loading posts:', err)
      setPosts([])
    }
  }, [])

  // Initialize on mount
  useEffect(() => {
    loadPosts()
    initDemoPosts()
    loadBreeds()
    loadRandomBreed()
    loadPipicanes()
    loadStores()
  }, [])

  const initDemoPosts = async () => {
    try {
      await fetch(`${API_BASE}/posts/demo`, { method: 'POST' })
      loadPosts()
    } catch (err) {
      console.error('Error init demo:', err)
    }
  }

  const loadBreeds = async () => {
    try {
      const res = await fetch(`${API_BASE}/breeds`)
      if (res.ok) {
        const data = await res.json()
        setBreeds(data)
      }
    } catch (err) {
      console.error('Error loading breeds:', err)
    }
  }

  const loadRandomBreed = async () => {
    try {
      const res = await fetch(`${API_BASE}/breeds/random`)
      if (res.ok) {
        setRandomBreed(await res.json())
      }
    } catch (err) {
      console.error('Error random breed:', err)
    }
  }

  const loadPipicanes = async () => {
    try {
      const url = userLocation
        ? `${API_BASE}/pipicans/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}`
        : `${API_BASE}/pipicans`
      const res = await fetch(url)
      if (res.ok) setPipicanes(await res.json())
    } catch (err) {
      console.error('Error pipicanes:', err)
    }
  }

  const loadStores = async () => {
    try {
      const url = userLocation
        ? `${API_BASE}/stores/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}`
        : `${API_BASE}/stores`
      const res = await fetch(url)
      if (res.ok) setStores(await res.json())
    } catch (err) {
      console.error('Error stores:', err)
    }
  }

  const loadUserPosts = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/posts/user/${userId}`)
      if (res.ok) setUserPosts(await res.json())
    } catch (err) {
      console.error('Error user posts:', err)
    }
  }

  // Get user location
  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalizacion')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setLocationError('')
        // Reload nearby data
        setTimeout(() => {
          loadPipicanes()
          loadStores()
        }, 100)
      },
      (err) => {
        setLocationError('No se pudo obtener tu ubicacion. Activa el GPS.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Auth handlers
  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAuthError('')

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      const body = isRegister ? registerData : loginData

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('ladridos_token', data.token)
        setUser(data.user)
        setShowLogin(false)
        setLoginData({ email: '', password: '' })
        setRegisterData({ nombre: '', email: '', password: '', nombrePerro: '', razaPerro: '', mesNacimiento: '', anioNacimiento: '' })
        loadUserPosts(data.user.userId)
      } else {
        setAuthError(data.message || 'Error')
      }
    } catch (err) {
      setAuthError('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('ladridos_token')
    setUser(null)
    setUserPosts([])
    setActiveTab('home')
  }

  // Post actions
  const handleLike = async (postId) => {
    try {
      await fetch(`${API_BASE}/posts/${postId}/like`, { method: 'POST' })
      loadPosts()
    } catch (err) {
      console.error('Error like:', err)
    }
  }

  const handleComment = async (postId) => {
    if (!user) {
      setShowLogin(true)
      return
    }
    const texto = commentText[postId]
    if (!texto?.trim()) return

    try {
      await fetch(`${API_BASE}/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ladridos_token')}`
        },
        body: JSON.stringify({ texto })
      })
      setCommentText({ ...commentText, [postId]: '' })
      loadPosts()
    } catch (err) {
      console.error('Error comment:', err)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!user) {
      setShowLogin(true)
      return
    }
    if (!postData.archivo) {
      alert('Selecciona un video')
      return
    }
    if (postData.archivo.size > 2 * 1024 * 1024) {
      alert(`El video pesa ${(postData.archivo.size / (1024*1024)).toFixed(1)}MB. El maximo es 2MB.`)
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('raza', postData.raza)
    formData.append('historia', postData.historia)
    formData.append('archivo', postData.archivo)

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ladridos_token')}` },
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setShowUpload(false)
        setPostData({ raza: '', historia: '', archivo: null })
        loadPosts()
        loadUserPosts(user.userId)
      } else {
        alert(data.message || 'Error al subir')
      }
    } catch (err) {
      alert('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowInstallBanner(false)
        localStorage.setItem('ladridos_installed', 'true')
      }
      setDeferredPrompt(null)
    } else {
      setShowInstallBanner(false)
    }
  }

  // Filter breeds
  const filteredBreeds = breeds.filter(b => {
    const matchSearch = !breedSearch || b.nombre.toLowerCase().includes(breedSearch.toLowerCase())
    const matchGroup = !breedGroupFilter || b.grupoFCI === breedGroupFilter
    return matchSearch && matchGroup
  })

  // FCI groups for filter
  const fciGroups = ['', 'Grupo I', 'Grupo II', 'Grupo III', 'Grupo IV', 'Grupo V', 'Grupo VI', 'Grupo VII', 'Grupo VIII', 'Grupo IX', 'Grupo X', 'Hibrido']
  const groupLabels = {
    '': 'Todos los grupos',
    'Grupo I': 'I - Pastor',
    'Grupo II': 'II - Molosoides',
    'Grupo III': 'III - Terriers',
    'Grupo IV': 'IV - Teckels',
    'Grupo V': 'V - Spitz',
    'Grupo VI': 'VI - Sabuesos',
    'Grupo VII': 'VII - Muestra',
    'Grupo VIII': 'VIII - Cobradores',
    'Grupo IX': 'IX - Compania',
    'Grupo X': 'X - Lebreles',
    'Hibrido': 'Hibridos'
  }

  return (
    <div className="app">
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="pwa-banner">
          <span><Download size={14} style={{display:'inline', verticalAlign:'middle'}} /> Instala Ladridos en tu movil</span>
          <div style={{display:'flex', gap:'8px'}}>
            <button onClick={installApp}>Instalar</button>
            <button onClick={() => setShowInstallBanner(false)}>Ahora no</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <img src="/img/icon-80.png" alt="Ladridos" />
          <h1>Ladridos</h1>
        </div>
        <div className="header-actions">
          {user ? (
            <>
              <span style={{fontSize:'0.8rem', opacity:0.8}}>{user.nombre}</span>
              <button className="btn-icon" onClick={handleLogout} title="Cerrar sesion">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => setShowLogin(true)}>
              Entrar
            </button>
          )}
        </div>
      </header>

      {/* Content based on active tab */}
      {activeTab === 'home' && (
        <HomeFeed
          posts={posts}
          user={user}
          randomBreed={randomBreed}
          onLike={handleLike}
          onComment={handleComment}
          commentText={commentText}
          setCommentText={setCommentText}
          onOpenCaninoteca={() => setActiveTab('caninoteca')}
          onShowLogin={() => setShowLogin(true)}
        />
      )}

      {activeTab === 'caninoteca' && (
        <Caninoteca
          breeds={filteredBreeds}
          allBreeds={breeds}
          breedSearch={breedSearch}
          setBreedSearch={setBreedSearch}
          breedGroupFilter={breedGroupFilter}
          setBreedGroupFilter={setBreedGroupFilter}
          fciGroups={fciGroups}
          groupLabels={groupLabels}
          onBreedClick={setShowBreedDetail}
          onRandomBreed={loadRandomBreed}
          randomBreed={randomBreed}
        />
      )}

      {activeTab === 'pipicanes' && (
        <PipicanesView
          pipicanes={pipicanes}
          userLocation={userLocation}
          locationError={locationError}
          onGetLocation={getLocation}
        />
      )}

      {activeTab === 'stores' && (
        <StoresView
          stores={stores}
          userLocation={userLocation}
          onGetLocation={getLocation}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileView
          user={user}
          userPosts={userPosts}
          onShowLogin={() => setShowLogin(true)}
          onLogout={handleLogout}
        />
      )}

      {/* FAB - Upload button (only when logged in) */}
      {user && activeTab === 'home' && (
        <button className="fab" onClick={() => setShowUpload(true)} title="Subir video">
          <Upload size={24} />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={22} />
          <span>Inicio</span>
        </button>
        <button className={`nav-item ${activeTab === 'caninoteca' ? 'active' : ''}`} onClick={() => setActiveTab('caninoteca')}>
          <BookOpen size={22} />
          <span>Caninoteca</span>
        </button>
        <button className={`nav-item ${activeTab === 'pipicanes' ? 'active' : ''}`} onClick={() => setActiveTab('pipicanes')}>
          <MapPin size={22} />
          <span>Pipicanes</span>
        </button>
        <button className={`nav-item ${activeTab === 'stores' ? 'active' : ''}`} onClick={() => setActiveTab('stores')}>
          <Store size={22} />
          <span>Tiendas</span>
        </button>
        <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <UserIcon size={22} />
          <span>Perfil</span>
        </button>
      </nav>

      {/* Login Modal */}
      {showLogin && (
        <LoginModal
          isRegister={isRegister}
          setIsRegister={setIsRegister}
          loginData={loginData}
          setLoginData={setLoginData}
          registerData={registerData}
          setRegisterData={setRegisterData}
          onAuth={handleAuth}
          onClose={() => { setShowLogin(false); setAuthError('') }}
          loading={loading}
          authError={authError}
          breeds={breeds}
        />
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          postData={postData}
          setPostData={setPostData}
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
          loading={loading}
          breeds={breeds}
        />
      )}

      {/* Breed Detail Modal */}
      {showBreedDetail && (
        <BreedDetailModal
          breed={showBreedDetail}
          onClose={() => setShowBreedDetail(null)}
        />
      )}

      {/* Footer */}
      <footer className="footer">
        <p>Creado por <strong>Victor M.F. Avilan - Valor Agregado</strong></p>
        <p>Ladridos (c) 2026 - Todos los derechos reservados</p>
      </footer>
    </div>
  )
}

// ===== HOME FEED COMPONENT =====
function HomeFeed({ posts, user, randomBreed, onLike, onComment, commentText, setCommentText, onOpenCaninoteca, onShowLogin }) {
  return (
    <>
      {/* Hero breed rotation */}
      {randomBreed && (
        <div className="hero">
          <div className="hero-breed-card" onClick={onOpenCaninoteca}>
            <img
              src={randomBreed.imagen}
              alt={randomBreed.nombre}
              className="hero-breed-img"
              onError={(e) => { e.target.src = '/img/icon-512.png' }}
            />
            <div className="hero-breed-info">
              <h3>{randomBreed.nombre}</h3>
              <p>{randomBreed.descripcion || 'Descubre mas sobre esta raza en la Caninoteca'}</p>
              <small>Toca para explorar la Caninoteca</small>
            </div>
          </div>
        </div>
      )}

      {/* Posts feed */}
      <div className="feed">
        <div className="section-title">
          <PawPrint size={18} />
          <span>Ultimos videos</span>
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">[dog]</div>
            <p>Aun no hay videos compartidos.<br />Sé el primero en subir el tuyo!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-author">
                  <div className="post-author-avatar">
                    {post.autor?.charAt(0)?.toUpperCase() || 'D'}
                  </div>
                  <div>
                    {post.autor}
                    <span className="post-raza-badge"> {post.raza}</span>
                  </div>
                </div>
                <small className="post-date">
                  {new Date(post.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </small>
              </div>

              <p className="post-historia">{post.historia}</p>

              {post.tipoArchivo?.startsWith('video/') ? (
                <video className="post-media" controls preload="metadata" src={post.archivo} />
              ) : (
                <img className="post-media" src={post.archivo} alt="Post" />
              )}

              <div className="post-actions">
                <button className="action-btn" onClick={() => onLike(post.id)}>
                  <Heart size={20} />
                  <span>{post.likes || 0}</span>
                </button>
                <button className="action-btn">
                  <MessageCircle size={20} />
                  <span>{post.comentarios?.length || 0}</span>
                </button>
                <button className="action-btn">
                  <Share2 size={20} />
                </button>
              </div>

              <div className="post-comments">
                {post.comentarios?.map((c, i) => (
                  <div key={i} className="comment">
                    <strong>{c.autor}:</strong> {c.texto}
                  </div>
                ))}

                {user ? (
                  <div className="comment-input-row">
                    <input
                      className="comment-input"
                      placeholder="Escribe un comentario..."
                      value={commentText[post.id] || ''}
                      onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && onComment(post.id)}
                    />
                    <button className="btn-comment" onClick={() => onComment(post.id)}>Enviar</button>
                  </div>
                ) : (
                  <p style={{fontSize:'0.8rem', color:'var(--color-text-light)', marginTop:'8px'}}>
                    <button className="link-btn" onClick={onShowLogin}>Inicia sesion</button> para comentar
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

// ===== CANINOTECA COMPONENT =====
function Caninoteca({ breeds, allBreeds, breedSearch, setBreedSearch, breedGroupFilter, setBreedGroupFilter, fciGroups, groupLabels, onBreedClick, onRandomBreed, randomBreed }) {
  return (
    <>
      <div className="caninoteca-search">
        <input
          className="form-input"
          placeholder="Buscar raza..."
          value={breedSearch}
          onChange={(e) => setBreedSearch(e.target.value)}
        />
        <select
          className="form-select"
          style={{width:'auto'}}
          value={breedGroupFilter}
          onChange={(e) => setBreedGroupFilter(e.target.value)}
        >
          {fciGroups.map(g => (
            <option key={g} value={g}>{groupLabels[g]}</option>
          ))}
        </select>
      </div>

      <div className="caninoteca-stats">
        {breeds.length} razas {breedSearch || breedGroupFilter ? 'encontradas' : 'disponibles'}
        <button className="link-btn" style={{marginLeft:'8px'}} onClick={onRandomBreed}>Raza al azar</button>
      </div>

      <div className="caninoteca-grid">
        {breeds.map((breed, i) => (
          <div key={i} className="breed-card" onClick={() => onBreedClick(breed)}>
            <img
              src={breed.imagen}
              alt={breed.nombre}
              onError={(e) => { e.target.src = '/img/icon-512.png' }}
            />
            <div className="breed-card-info">
              <h4>{breed.nombre}</h4>
              <p>{breed.origen} - {breed.tamano}</p>
            </div>
          </div>
        ))}
      </div>

      {breeds.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">[search]</div>
          <p>No se encontraron razas.<br />Intenta con otro termino de busqueda.</p>
        </div>
      )}
    </>
  )
}

// ===== BREED DETAIL MODAL =====
function BreedDetailModal({ breed, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{breed.nombre}</h2>
          <button className="btn-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body breed-detail">
          {breed.grupoFCI && <span className="fci-badge">{breed.grupoFCI}</span>}
          <img
            src={breed.imagen}
            alt={breed.nombre}
            onError={(e) => { e.target.src = '/img/icon-512.png' }}
          />
          <h3>{breed.nombre}</h3>
          <p className="descripcion">{breed.descripcion}</p>

          <div className="detail-grid">
            <div className="detail-item">
              <span className="label">Origen</span>
              <span className="value">{breed.origen}</span>
            </div>
            <div className="detail-item">
              <span className="label">Tamano</span>
              <span className="value">{breed.tamano}</span>
            </div>
            <div className="detail-item">
              <span className="label">Temperamento</span>
              <span className="value">{breed.temperamento}</span>
            </div>
            <div className="detail-item">
              <span className="label">Cuidados</span>
              <span className="value">{breed.cuidados}</span>
            </div>
            <div className="detail-item">
              <span className="label">Esperanza de vida</span>
              <span className="value">{breed.esperanzaVida}</span>
            </div>
            <div className="detail-item">
              <span className="label">Altura</span>
              <span className="value">{breed.altura || 'N/D'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== PIPICANES VIEW =====
function PipicanesView({ pipicanes, userLocation, locationError, onGetLocation }) {
  const [selectedPipican, setSelectedPipican] = useState(null)

  const mapUrl = selectedPipican
    ? `https://maps.google.com/maps?q=${selectedPipican.lat},${selectedPipican.lng}&z=15&output=embed`
    : userLocation
      ? `https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lng}&z=12&output=embed`
      : `https://maps.google.com/maps?q=41.3874,2.1686&z=12&output=embed`

  return (
    <>
      <div className="hero" style={{paddingBottom: 0}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px'}}>
          <div className="section-title" style={{margin:0}}>
            <MapPin size={20} />
            <span>Pipicanes</span>
          </div>
          <button className="btn-primary" onClick={onGetLocation}>
            <Navigation size={14} style={{display:'inline', verticalAlign:'middle'}} /> Mi ubicacion
          </button>
        </div>

        {locationError && (
          <p style={{color:'var(--color-danger)', fontSize:'0.85rem', marginBottom:'8px'}}>{locationError}</p>
        )}

        <div className="map-container">
          <iframe src={mapUrl} allowFullScreen loading="lazy" title="Mapa Pipicanes" />
        </div>
      </div>

      <div className="location-list">
        {pipicanes.map(p => (
          <div key={p.id} className="location-item" onClick={() => setSelectedPipican(p)}>
            <div className="location-icon">
              <PawPrint size={20} />
            </div>
            <div className="location-info">
              <h4>{p.nombre}</h4>
              <p>{p.direccion}, {p.ciudad}</p>
              {p.distancia !== undefined && (
                <span className="location-distance">{p.distancia} km</span>
              )}
              <div className="location-features">
                {p.vallas && <span className="feature-tag">Vallado</span>}
                {p.agua && <span className="feature-tag">Agua</span>}
                {p.sombra && <span className="feature-tag">Sombra</span>}
                <span className="feature-tag"><Clock size={10} style={{display:'inline'}}/> {p.horario}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ===== STORES VIEW =====
function StoresView({ stores, userLocation, onGetLocation }) {
  const [selectedStore, setSelectedStore] = useState(null)

  const mapUrl = selectedStore
    ? `https://maps.google.com/maps?q=${selectedStore.lat},${selectedStore.lng}&z=15&output=embed`
    : userLocation
      ? `https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lng}&z=12&output=embed`
      : `https://maps.google.com/maps?q=41.3874,2.1686&z=12&output=embed`

  return (
    <>
      <div className="hero" style={{paddingBottom: 0}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px'}}>
          <div className="section-title" style={{margin:0}}>
            <Store size={20} />
            <span>Tiendas de mascotas</span>
          </div>
          <button className="btn-primary" onClick={onGetLocation}>
            <Navigation size={14} style={{display:'inline', verticalAlign:'middle'}} /> Mi ubicacion
          </button>
        </div>

        <div className="map-container">
          <iframe src={mapUrl} allowFullScreen loading="lazy" title="Mapa Tiendas" />
        </div>
      </div>

      <div className="location-list">
        {stores.map(s => (
          <div key={s.id} className="location-item" onClick={() => setSelectedStore(s)}>
            <div className="location-icon" style={{background:'rgba(124, 58, 237, 0.15)', color:'var(--color-purple)'}}>
              <Store size={20} />
            </div>
            <div className="location-info">
              <h4>{s.nombre}</h4>
              <p>{s.direccion}, {s.ciudad}</p>
              {s.telefono && <p style={{fontSize:'0.75rem'}}>{s.telefono}</p>}
              {s.distancia !== undefined && (
                <span className="location-distance">{s.distancia} km</span>
              )}
              <div className="location-features">
                {s.servicios?.map((srv, i) => (
                  <span key={i} className="feature-tag">{srv}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ===== PROFILE VIEW =====
function ProfileView({ user, userPosts, onShowLogin, onLogout }) {
  if (!user) {
    return (
      <div className="empty-state" style={{paddingTop:'60px'}}>
        <div className="empty-state-icon">[user]</div>
        <p>No has iniciado sesion.<br />Inicia sesion para ver tu perfil y subir videos.</p>
        <button className="btn-primary" style={{marginTop:'16px'}} onClick={onShowLogin}>
          Iniciar sesion
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="profile-header">
        <div className="profile-avatar">
          {user.nombre?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="profile-name">{user.nombre}</div>
        <div className="profile-email">{user.email}</div>

        {user.perro?.nombre && (
          <div className="profile-dog">
            <div className="profile-dog-name">[paw] {user.perro.nombre}</div>
            <div className="profile-dog-info">
              {user.perro.raza && `Raza: ${user.perro.raza}`}
              {user.perro.mesNacimiento && user.perro.anioNacimiento && ` - Nacio: ${user.perro.mesNacimiento}/${user.perro.anioNacimiento}`}
            </div>
          </div>
        )}
      </div>

      <div className="profile-section">
        <h3>Mis videos ({userPosts.length})</h3>
        {userPosts.length === 0 ? (
          <div className="empty-state" style={{padding:'20px'}}>
            <p>Aun no has subido videos.</p>
          </div>
        ) : (
          userPosts.map(post => (
            <div key={post.id} className="profile-video-item">
              <video controls preload="metadata" src={post.archivo} />
              <div className="profile-video-info">
                <p>{post.raza} - {post.historia}</p>
                <small style={{color:'var(--color-text-light)'}}>
                  {post.likes || 0} likes - {post.comentarios?.length || 0} comentarios
                </small>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="profile-section">
        <button className="btn-secondary" style={{width:'100%'}} onClick={onLogout}>
          <LogOut size={16} style={{display:'inline', verticalAlign:'middle'}} /> Cerrar sesion
        </button>
      </div>
    </>
  )
}

// ===== LOGIN MODAL =====
function LoginModal({ isRegister, setIsRegister, loginData, setLoginData, registerData, setRegisterData, onAuth, onClose, loading, authError, breeds }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isRegister ? 'Crear cuenta' : 'Iniciar sesion'}</h2>
          <button className="btn-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {authError && <p className="form-error" style={{marginBottom:'12px', textAlign:'center'}}>{authError}</p>}

          <form onSubmit={onAuth}>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input
                  className="form-input"
                  type="text"
                  value={registerData.nombre}
                  onChange={(e) => setRegisterData({...registerData, nombre: e.target.value})}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={isRegister ? registerData.email : loginData.email}
                onChange={(e) => isRegister
                  ? setRegisterData({...registerData, email: e.target.value})
                  : setLoginData({...loginData, email: e.target.value})
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contrasena</label>
              <input
                className="form-input"
                type="password"
                value={isRegister ? registerData.password : loginData.password}
                onChange={(e) => isRegister
                  ? setRegisterData({...registerData, password: e.target.value})
                  : setLoginData({...loginData, password: e.target.value})
                }
                required
              />
            </div>

            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">Nombre de tu perro (opcional)</label>
                  <input
                    className="form-input"
                    type="text"
                    value={registerData.nombrePerro}
                    onChange={(e) => setRegisterData({...registerData, nombrePerro: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Raza de tu perro (opcional)</label>
                  <input
                    className="form-input"
                    type="text"
                    list="razas-list"
                    value={registerData.razaPerro}
                    onChange={(e) => setRegisterData({...registerData, razaPerro: e.target.value})}
                  />
                  <datalist id="razas-list">
                    {breeds.slice(0, 100).map((b, i) => (
                      <option key={i} value={b.nombre} />
                    ))}
                  </datalist>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Mes nacimiento</label>
                    <select
                      className="form-select"
                      value={registerData.mesNacimiento}
                      onChange={(e) => setRegisterData({...registerData, mesNacimiento: e.target.value})}
                    >
                      <option value="">-</option>
                      {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => (
                        <option key={i} value={i+1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Anio nacimiento</label>
                    <input
                      className="form-input"
                      type="number"
                      min="2000"
                      max="2026"
                      value={registerData.anioNacimiento}
                      onChange={(e) => setRegisterData({...registerData, anioNacimiento: e.target.value})}
                    />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn-primary" style={{width:'100%', marginTop:'8px'}} disabled={loading}>
              {loading ? 'Cargando...' : (isRegister ? 'Crear cuenta' : 'Entrar')}
            </button>
          </form>

          <p className="toggle-auth">
            {isRegister ? 'Ya tienes cuenta?' : 'No tienes cuenta?'}
            <button className="link-btn" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Iniciar sesion' : 'Registrarse'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// ===== UPLOAD MODAL =====
function UploadModal({ postData, setPostData, onUpload, onClose, loading, breeds }) {
  const [fileError, setFileError] = useState('')

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      setFileError('Solo se permiten archivos de video')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setFileError(`El video pesa ${(file.size/(1024*1024)).toFixed(1)}MB. El maximo es 2MB.`)
      return
    }
    setFileError('')
    setPostData({...postData, archivo: file})
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Compartir video</h2>
          <button className="btn-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <form onSubmit={onUpload}>
            <div className="form-group">
              <label className="form-label">Raza del perro</label>
              <input
                className="form-input"
                type="text"
                list="razas-upload"
                value={postData.raza}
                onChange={(e) => setPostData({...postData, raza: e.target.value})}
                required
              />
              <datalist id="razas-upload">
                {breeds.slice(0, 150).map((b, i) => (
                  <option key={i} value={b.nombre} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">Comentario sobre el video</label>
              <textarea
                className="form-textarea"
                placeholder="Cuenta la historia de tu perro..."
                value={postData.historia}
                onChange={(e) => setPostData({...postData, historia: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Video (max 2MB)</label>
              <input
                className="form-input"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                required
              />
              {fileError && <p className="form-error">{fileError}</p>}
              {postData.archivo && !fileError && (
                <p style={{fontSize:'0.8rem', color:'var(--color-success)', marginTop:'4px'}}>
                  Archivo: {postData.archivo.name} ({(postData.archivo.size/(1024*1024)).toFixed(1)}MB)
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary" style={{width:'100%'}} disabled={loading || !!fileError}>
              {loading ? 'Subiendo...' : 'Publicar video'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
