import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { AgeVerificationModal } from '@/components/AgeVerificationModal'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <AgeVerificationModal />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
