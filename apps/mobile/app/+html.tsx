import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { height: 100%; width: 100%; }
              body { margin: 0; overflow: auto; }
              #root { display: flex; flex-direction: column; }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
