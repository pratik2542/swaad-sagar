import '../styles/globals.css'
import Nav from '../components/Nav'
import { AuthProvider } from '../context/AuthContext'

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Nav />
      <Component {...pageProps} />
    </AuthProvider>
  )
}
