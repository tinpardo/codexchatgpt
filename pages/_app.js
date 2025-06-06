import { ClerkProvider } from '@clerk/nextjs';
import { clerkOptions } from '../modules/clerk';

export default function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider {...clerkOptions}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
