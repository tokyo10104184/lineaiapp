import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { AuthProvider } from '@/src/contexts/AuthContext'
import { AgeVerificationModal } from '@/components/AgeVerificationModal'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AgeVerificationModal />
      <Component {...pageProps} />
    </AuthProvider>
  )
}

export default MyApp
