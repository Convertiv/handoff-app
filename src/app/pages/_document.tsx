import Document, { Head, Html, Main, NextScript } from 'next/document';
import Script from 'next/script';
import { dockWidthScript } from '../components/AiAssistant/dockState';
import { getClientRuntimeConfig } from '../components/util';

const config = getClientRuntimeConfig();

// A build with no assistant must not reserve a column for state an earlier build left behind.
const hasAssistant = process.env.HANDOFF_AI_ENABLED === 'true' && process.env.HANDOFF_BUILD_TARGET !== 'static';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="shortcut icon" href={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/favicon.ico`} />
          <link rel="icon" sizes="16x16 32x32 64x64" href={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/favicon.ico`} />
          {/* Blocking on purpose: it reserves the assistant's column before the first paint. */}
          {hasAssistant && <script dangerouslySetInnerHTML={{ __html: dockWidthScript }} />}
          {config?.app?.google_tag_manager && (
            <Script id="google-tag-manager" strategy="afterInteractive">
              {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${config.app.google_tag_manager}');
          `}
            </Script>
          )}
        </Head>
        <body>
          {config?.app?.google_tag_manager && (
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${config.app.google_tag_manager}`}
                height="0"
                width="0"
                title="googleTagManagerNoScript"
                style={{
                  display: 'none',
                  visibility: 'hidden',
                }}
              />
            </noscript>
          )}
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
