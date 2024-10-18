import Navbar from './navbar';

export default function RootLayout({ children }: {
    children: React.ReactNode;
  }) {
    return (
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>GIP Dashboard</title>
        </head>
        <body className='prose prose-invert h-screen flex flex-col'>
          <Navbar />
          <main className='w-screen h-full flex overflow-hidden'>
            {children}
          </main>
        </body>
      </html>
    );
  }