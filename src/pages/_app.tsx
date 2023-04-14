import '@/src/styles/base.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import Providers from '../components/Providers';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Providers>
        <main className={inter.variable}>
          <Component {...pageProps} />
        </main>
      </Providers>
    </>
  );
}

export default MyApp;
