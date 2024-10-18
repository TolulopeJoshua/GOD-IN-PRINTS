import '../public/globals.css'
import { Provider } from 'react-redux';
import store from '../store/index';
import { Toaster } from 'react-hot-toast'
import type { AppProps } from 'next/app'
import Layout from '../components/layout'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      {/* <Provider store={store}>
      <Toaster /> */}
      <Component {...pageProps} />
      {/* </Provider> */}
  </Layout>
  )
}
